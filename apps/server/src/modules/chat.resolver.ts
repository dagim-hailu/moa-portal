import { Args, Context, Field, ID, Int, Mutation, ObjectType, Query, Resolver } from "@nestjs/graphql";
import { Inject, UseGuards } from "@nestjs/common";
import { DatabaseService } from "../db/database.service";
import { eq, and, or, desc, inArray, isNotNull } from "drizzle-orm";
import { 
  chatRooms, chatMessages, chatRoomMembers, users, 
  chatBlockedEntities, chatPinnedConversations, chatDirectReadStatus
} from "@moa/shared/db";
import { JwtAuthGuard } from "./auth/jwt.guard";

@ObjectType()
export class ChatUser {
  @Field(() => ID) id!: string;
  @Field() fullName!: string;
  @Field({ nullable: true }) username?: string;
  @Field({ nullable: true }) phoneNumber?: string;
  @Field({ nullable: true }) avatarUrl?: string;
}

@ObjectType()
export class ChatRoom {
  @Field(() => ID) id!: string;
  @Field({ nullable: true }) name?: string;
  @Field() type!: string;
  @Field({ nullable: true }) avatarUrl?: string;
  @Field({ nullable: true }) description?: string;
  @Field() createdAt!: string;
}

@ObjectType()
export class ChatRoomMember {
  @Field(() => ID) userId!: string;
  @Field(() => ID) roomId!: string;
  @Field() role!: string;
  @Field(() => ChatUser, { nullable: true }) user?: ChatUser;
}

@ObjectType()
export class ChatMessage {
  @Field(() => ID) id!: string;
  @Field({ nullable: true }) roomId?: string;
  @Field() senderId!: string;
  @Field({ nullable: true }) receiverId?: string;
  @Field({ nullable: true }) content?: string;
  @Field({ nullable: true }) fileUrl?: string;
  @Field({ nullable: true }) fileType?: string;
  @Field() messageType!: string;
  @Field(() => Int, { nullable: true }) voiceDuration?: number;
  @Field({ nullable: true }) replyToId?: string;
  @Field({ nullable: true }) deletedAt?: string;
  @Field() createdAt!: string;
  @Field(() => ChatUser, { nullable: true }) sender?: ChatUser;
}

@ObjectType()
export class ChatPinnedConversation {
  @Field(() => ID) targetId!: string;
  @Field() targetType!: string;
}

@ObjectType()
export class ChatBlockedEntity {
  @Field(() => ID) blockedId!: string;
  @Field() blockedType!: string;
}

@ObjectType()
export class ChatNotification {
  @Field(() => ID) id!: string;
  @Field() type!: string;
  @Field() title!: string;
  @Field() message!: string;
  @Field({ nullable: true }) linkId?: string;
  @Field() createdAt!: string;
}

@Resolver()
@UseGuards(JwtAuthGuard)
export class ChatResolver {
  constructor(private db: DatabaseService) {}

  // ==========================================
  // QUERIES
  // ==========================================

  @Query(() => [ChatRoom])
  async getUserRooms(@Context() ctx: any) {
    const userId = ctx.req.user.id;
    const members = await this.db.db.select().from(chatRoomMembers).where(eq(chatRoomMembers.userId, userId));
    if (members.length === 0) return [];
    
    const roomIds = members.map(m => m.roomId);
    const rooms = await this.db.db.select().from(chatRooms).where(inArray(chatRooms.id, roomIds));
    return rooms.map(r => ({ ...r, createdAt: r.createdAt.toISOString() }));
  }

  @Query(() => [ChatRoomMember])
  async getRoomMembers(@Args("roomId") roomId: string) {
    const members = await this.db.db.select().from(chatRoomMembers).where(eq(chatRoomMembers.roomId, roomId));
    const userIds = members.map(m => m.userId);
    if (userIds.length === 0) return [];

    const userList = await this.db.db.select().from(users).where(inArray(users.id, userIds));
    const userMap = new Map(userList.map(u => [u.id, u]));

    return members.map(m => ({
      ...m,
      user: userMap.get(m.userId) as unknown as ChatUser,
    }));
  }

  @Query(() => [ChatMessage])
  async getChatHistory(
    @Context() ctx: any,
    @Args("roomId", { nullable: true }) roomId?: string,
    @Args("otherUserId", { nullable: true }) otherUserId?: string
  ) {
    const userId = ctx.req.user.id;

    if (!roomId && !otherUserId) return [];

    const where = roomId
      ? eq(chatMessages.roomId, roomId)
      : or(
          and(eq(chatMessages.senderId, userId), eq(chatMessages.receiverId, otherUserId!)),
          and(eq(chatMessages.senderId, otherUserId!), eq(chatMessages.receiverId, userId)),
        );

    const msgs = await this.db.db
      .select()
      .from(chatMessages)
      .where(where)
      .orderBy(desc(chatMessages.createdAt))
      .limit(100);
    
    const userIds = [...new Set(msgs.map((m: any) => m.senderId))] as string[];
    const userList = userIds.length > 0 ? await this.db.db.select().from(users).where(inArray(users.id, userIds)) : [];
    const userMap = new Map(userList.map(u => [u.id, u]));

    return msgs.map((m: any) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      deletedAt: m.deletedAt?.toISOString(),
      sender: userMap.get(m.senderId) as unknown as ChatUser,
    }));
  }

  @Query(() => [ChatMessage])
  async getDeletedMessages(@Context() ctx: any) {
    const userId = ctx.req.user.id;
    // For simplicity, showing deleted messages sent by the user, or deleted messages in rooms they belong to.
    const msgs = await this.db.db.select()
      .from(chatMessages)
      .where(and(eq(chatMessages.senderId, userId), isNotNull(chatMessages.deletedAt)))
      .orderBy(desc(chatMessages.deletedAt));

    return msgs.map(m => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      deletedAt: m.deletedAt?.toISOString(),
    }));
  }

  @Query(() => [ChatPinnedConversation])
  async getPinnedConversations(@Context() ctx: any) {
    const userId = ctx.req.user.id;
    const pins = await this.db.db.select().from(chatPinnedConversations).where(eq(chatPinnedConversations.userId, userId));
    return pins;
  }

  @Query(() => [ChatBlockedEntity])
  async getBlockedEntities(@Context() ctx: any) {
    const userId = ctx.req.user.id;
    const blocks = await this.db.db.select().from(chatBlockedEntities).where(eq(chatBlockedEntities.blockerId, userId));
    return blocks;
  }

  // ==========================================
  // MUTATIONS
  // ==========================================

  @Mutation(() => ChatRoom)
  async createRoom(
    @Context() ctx: any,
    @Args("name") name: string,
    @Args("type") type: string,
    @Args("description", { nullable: true }) description?: string,
    @Args("avatarUrl", { nullable: true }) avatarUrl?: string,
    @Args("memberIds", { type: () => [String], nullable: true }) memberIds?: string[]
  ) {
    const userId = ctx.req.user.id;
    
    const [room] = (await this.db.db.insert(chatRooms).values({
      name, type, description, avatarUrl, createdBy: userId,
    }).returning()) as any;

    const membersToInsert = [{ roomId: room.id, userId, role: "admin" }];
    
    if (memberIds && memberIds.length > 0) {
      for (const mId of memberIds) {
        if (mId !== userId) {
          membersToInsert.push({ roomId: room.id, userId: mId, role: "member" });
        }
      }
    }

    await this.db.db.insert(chatRoomMembers).values(membersToInsert);

    const roomPayload = { ...room, createdAt: room.createdAt.toISOString() };

    return roomPayload;
  }

  @Mutation(() => ChatMessage)
  async sendMessage(
    @Context() ctx: any,
    @Args("roomId", { nullable: true }) roomId?: string,
    @Args("receiverId", { nullable: true }) receiverId?: string,
    @Args("content", { nullable: true }) content?: string,
    @Args("fileUrl", { nullable: true }) fileUrl?: string,
    @Args("fileType", { nullable: true }) fileType?: string,
    @Args("messageType", { defaultValue: "text" }) messageType?: string,
  ) {
    const userId = ctx.req.user.id;

    // Feature 12: Block Check
    if (receiverId) {
      const blocks = await this.db.db.select().from(chatBlockedEntities).where(
        or(
          and(eq(chatBlockedEntities.blockerId, receiverId), eq(chatBlockedEntities.blockedId, userId)),
          and(eq(chatBlockedEntities.blockerId, userId), eq(chatBlockedEntities.blockedId, receiverId))
        )
      );
      if (blocks.length > 0) throw new Error("Blocked");
    }

    if (roomId) {
      const room = await this.db.db.select().from(chatRooms).where(eq(chatRooms.id, roomId)).limit(1);
      if (room.length === 0) throw new Error("Room not found");
      
      const member = await this.db.db.select().from(chatRoomMembers).where(and(eq(chatRoomMembers.roomId, roomId), eq(chatRoomMembers.userId, userId))).limit(1);
      if (member.length === 0) throw new Error("Not a member");

      // Feature 7: Channel Permissions
      if (room[0].type === "channel") {
        if (member[0].role !== "admin" && member[0].role !== "manager") {
          throw new Error("Only admins and managers can post in this channel.");
        }
      }
    }

    const [msg] = (await this.db.db.insert(chatMessages).values({
      roomId, receiverId, senderId: userId, content, fileUrl, fileType, messageType: messageType || "text"
    } as any).returning()) as any;

    const [sender] = await this.db.db.select().from(users).where(eq(users.id, userId));
    const msgPayload = {
      ...msg,
      createdAt: msg.createdAt.toISOString(),
      deletedAt: msg.deletedAt?.toISOString(),
      sender: sender as unknown as ChatUser,
    };

    return msgPayload;
  }

  @Mutation(() => Boolean)
  async updateProfile(
    @Context() ctx: any,
    @Args("fullName", { nullable: true }) fullName?: string,
    @Args("username", { nullable: true }) username?: string,
    @Args("phoneNumber", { nullable: true }) phoneNumber?: string,
    @Args("avatarUrl", { nullable: true }) avatarUrl?: string,
  ) {
    const userId = ctx.req.user.id;
    const updates: any = {};
    if (fullName) updates.fullName = fullName;
    if (username) updates.username = username;
    if (phoneNumber) updates.phoneNumber = phoneNumber;
    if (avatarUrl) updates.avatarUrl = avatarUrl;
    
    if (Object.keys(updates).length > 0) {
      await this.db.db.update(users).set(updates).where(eq(users.id, userId));
    }
    return true;
  }

  @Mutation(() => Boolean)
  async removeMember(
    @Context() ctx: any,
    @Args("roomId") roomId: string,
    @Args("userId") targetId: string
  ) {
    const adminId = ctx.req.user.id;
    // Check if admin
    const adminRec = await this.db.db.select().from(chatRoomMembers).where(and(eq(chatRoomMembers.roomId, roomId), eq(chatRoomMembers.userId, adminId))).limit(1);
    if (!adminRec.length || adminRec[0].role !== "admin") throw new Error("Unauthorized");

    await this.db.db.delete(chatRoomMembers).where(and(eq(chatRoomMembers.roomId, roomId), eq(chatRoomMembers.userId, targetId)));
    
    // Audit message (Feature 6)
    const [targetUser] = await this.db.db.select().from(users).where(eq(users.id, targetId));
    const [adminUser] = await this.db.db.select().from(users).where(eq(users.id, adminId));
    
    if (targetUser && adminUser) {
      const [msg] = (await this.db.db.insert(chatMessages).values({
        roomId, senderId: adminId, messageType: "system", content: `${targetUser.fullName} was removed by ${adminUser.fullName}`
      } as any).returning()) as any;
    }
    return true;
  }

  @Mutation(() => Boolean)
  async pinConversation(@Context() ctx: any, @Args("targetId") targetId: string, @Args("targetType") targetType: string) {
    const userId = ctx.req.user.id;
    await this.db.db.insert(chatPinnedConversations).values({ userId, conversationId: targetId }).onConflictDoNothing();
    return true;
  }

  @Mutation(() => Boolean)
  async unpinConversation(@Context() ctx: any, @Args("targetId") targetId: string) {
    const userId = ctx.req.user.id;
    await this.db.db.delete(chatPinnedConversations).where(and(eq(chatPinnedConversations.userId, userId), eq(chatPinnedConversations.conversationId, targetId)));
    return true;
  }

  @Mutation(() => Boolean)
  async blockEntity(@Context() ctx: any, @Args("blockedId") blockedId: string, @Args("blockedType") blockedType: string) {
    const userId = ctx.req.user.id;
    await this.db.db.insert(chatBlockedEntities).values({ blockerId: userId, blockedId }).onConflictDoNothing();
    return true;
  }

  @Mutation(() => Boolean)
  async deleteMessage(@Context() ctx: any, @Args("messageId") messageId: string) {
    const userId = ctx.req.user.id;
    await this.db.db.update(chatMessages).set({ deletedAt: new Date() } as any).where(and(eq(chatMessages.id, messageId), eq(chatMessages.senderId, userId)));
    return true;
  }
}
