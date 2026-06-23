import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { verifyAccessToken } from "@moa/shared/auth";
import { DatabaseService } from "../db/database.service";
import { serializeMessage } from "./chat/chat-cursor.util";

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

@WebSocketGateway({ cors: { origin: true, credentials: true }, maxHttpBufferSize: 10 * 1024 * 1024 })
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly database: DatabaseService) {}

  async afterInit(server: Server) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) return;
    try {
      const pub = createClient({ url: redisUrl });
      const sub = pub.duplicate();
      await Promise.all([pub.connect(), sub.connect()]);
      server.adapter(createAdapter(pub, sub));
      console.log("[ChatGateway] Redis adapter connected");
    } catch (err) {
      console.warn("[ChatGateway] Redis unavailable, using in-memory adapter:", err);
    }
  }

  async handleConnection(client: Socket) {
    try {
      const token = (client.handshake.auth?.token as string) || (client.handshake.headers.authorization?.split(" ")[1] ?? "");
      if (!token) throw new UnauthorizedException("Missing token");
      const user = await verifyAccessToken(token, process.env.JWT_SECRET ?? "replace_me");
      client.data.user = user;
      await client.join(user.sub);
      this.server.emit("userStatus", { userId: user.sub, online: true });
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user as { sub: string } | undefined;
    if (user?.sub) {
      this.server.emit("userStatus", { userId: user.sub, online: false });
    }
  }

  @SubscribeMessage("joinRoom")
  async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string }) {
    const user = client.data.user;
    if (!user) throw new UnauthorizedException();
    const membership = await this.database.assertRoomMember(data.roomId, user.sub);
    if (!membership.ok) throw new ForbiddenException(membership.reason);
    await client.join(`room:${data.roomId}`);
  }

  @SubscribeMessage("leaveRoom")
  async handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string }) {
    await client.leave(`room:${data.roomId}`);
  }

  @SubscribeMessage("sendMessage")
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      receiverId?: string;
      roomId?: string;
      content?: string;
      fileUrl?: string;
      fileType?: string;
      messageType?: string;
      voiceDuration?: number;
      replyToId?: string;
      clientMessageId?: string;
    },
  ) {
    const sender = client.data.user;
    if (!sender) throw new UnauthorizedException();

    const hasReceiver = Boolean(data.receiverId);
    const hasRoom = Boolean(data.roomId);
    if (hasReceiver === hasRoom) throw new ForbiddenException("Message must target exactly one conversation");

    if (hasRoom) {
      const membership = await this.database.assertRoomMember(data.roomId!, sender.sub);
      if (!membership.ok) throw new ForbiddenException(membership.reason);
      if (membership.room.type === "channel") {
        const role = await this.database.getRoomMemberRole(data.roomId!, sender.sub);
        if (role !== "admin" && role !== "manager") {
          throw new ForbiddenException("Only admins and managers can post in channels");
        }
      }
    } else if (data.receiverId) {
      if (await this.database.hasBlocked(sender.sub, data.receiverId)) {
        throw new ForbiddenException("Cannot message this user");
      }
    }

    const saved = await this.database.saveChatMessage({
      senderId: sender.sub,
      receiverId: data.receiverId,
      roomId: data.roomId,
      content: data.content,
      fileUrl: data.fileUrl,
      fileType: data.fileType,
      messageType: data.messageType ?? "text",
      replyToId: data.replyToId,
      voiceDuration: data.voiceDuration,
    });

    const payload = {
      ...serializeMessage(saved as unknown as Record<string, unknown>),
      time: formatTime(saved.createdAt),
      clientMessageId: data.clientMessageId,
    };

    if (data.roomId) {
      client.to(`room:${data.roomId}`).emit("receiveMessage", payload);
      client.emit("messageSent", payload);
    } else if (data.receiverId) {
      this.server.to(data.receiverId).emit("receiveMessage", payload);
      client.emit("messageSent", payload);
    }
  }

  @SubscribeMessage("editMessage")
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; content: string; receiverId?: string; roomId?: string },
  ) {
    const sender = client.data.user;
    if (!sender) throw new UnauthorizedException();
    const updated = await this.database.editMessage(data.messageId, sender.sub, data.content);
    if (!updated) return;
    const event = { messageId: data.messageId, content: data.content, editedAt: updated.editedAt?.toISOString() };
    if (data.roomId) {
      this.server.to(`room:${data.roomId}`).emit("messageEdited", event);
    } else if (data.receiverId) {
      this.server.to(data.receiverId).emit("messageEdited", event);
      client.emit("messageEdited", event);
    }
  }

  @SubscribeMessage("deleteMessage")
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; receiverId?: string; roomId?: string },
  ) {
    const sender = client.data.user;
    if (!sender) throw new UnauthorizedException();
    const deleted = await this.database.softDeleteMessage(data.messageId, sender.sub);
    if (!deleted) return;
    const event = { messageId: data.messageId };
    if (data.roomId) {
      this.server.to(`room:${data.roomId}`).emit("messageDeleted", event);
    } else if (data.receiverId) {
      this.server.to(data.receiverId).emit("messageDeleted", event);
      client.emit("messageDeleted", event);
    }
  }

  @SubscribeMessage("restoreMessage")
  async handleRestoreMessage(@ConnectedSocket() client: Socket, @MessageBody() data: { messageId: string }) {
    const sender = client.data.user;
    if (!sender) throw new UnauthorizedException();
    await this.database.restoreMessage(data.messageId, sender.sub);
  }

  @SubscribeMessage("typing")
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId?: string; roomId?: string; isTyping: boolean },
  ) {
    const sender = client.data.user;
    if (!sender) return;
    const event = { userId: sender.sub, isTyping: data.isTyping };
    if (data.roomId) {
      client.to(`room:${data.roomId}`).emit("userTyping", event);
    } else if (data.receiverId) {
      this.server.to(data.receiverId).emit("userTyping", event);
    }
  }

  @SubscribeMessage("addReaction")
  handleReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; emoji: string; receiverId?: string; roomId?: string },
  ) {
    const sender = client.data.user;
    if (!sender) return;
    const event = { messageId: data.messageId, emoji: data.emoji, userId: sender.sub };
    if (data.roomId) {
      this.server.to(`room:${data.roomId}`).emit("messageReaction", event);
    } else if (data.receiverId) {
      this.server.to(data.receiverId).emit("messageReaction", event);
      client.emit("messageReaction", event);
    }
  }

  @SubscribeMessage("forwardMessage")
  async handleForwardMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      message: { content?: string; fileUrl?: string; fileType?: string; messageType?: string };
      targetUserId?: string;
      targetRoomId?: string;
    },
  ) {
    const sender = client.data.user;
    if (!sender) throw new UnauthorizedException();

    if (data.targetRoomId) {
      const membership = await this.database.assertRoomMember(data.targetRoomId, sender.sub);
      if (!membership.ok) throw new ForbiddenException(membership.reason);
    }

    const saved = await this.database.saveChatMessage({
      senderId: sender.sub,
      roomId: data.targetRoomId,
      receiverId: data.targetUserId,
      content: data.message?.content ?? undefined,
      fileUrl: data.message?.fileUrl ?? undefined,
      fileType: data.message?.fileType ?? undefined,
      messageType: data.message?.messageType ?? "text",
    });

    const payload = { ...serializeMessage(saved as unknown as Record<string, unknown>), time: formatTime(saved.createdAt) };
    if (data.targetRoomId) {
      this.server.to(`room:${data.targetRoomId}`).emit("receiveMessage", payload);
    } else if (data.targetUserId) {
      this.server.to(data.targetUserId).emit("receiveMessage", payload);
    }
    client.emit("messageSent", payload);
  }

  @SubscribeMessage("deleteRoom")
  async handleDeleteRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string }) {
    const sender = client.data.user;
    if (!sender) throw new UnauthorizedException();
    const deleted = await this.database.softDeleteRoom(data.roomId, sender.sub);
    if (!deleted) return;
    const members = await this.database.getRoomMembers(data.roomId);
    for (const m of members) {
      this.server.to(m.userId).emit("roomDeleted", { roomId: data.roomId });
    }
    this.server.to(`room:${data.roomId}`).emit("roomDeleted", { roomId: data.roomId });
  }

  @SubscribeMessage("editRoom")
  async handleEditRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; name?: string; description?: string },
  ) {
    const sender = client.data.user;
    if (!sender) throw new UnauthorizedException();
    const updated = await this.database.editRoom(data.roomId, sender.sub, data);
    if (!updated) return;
    const members = await this.database.getRoomMembers(data.roomId);
    const event = { id: updated.id, name: updated.name, description: updated.description, avatarUrl: updated.avatarUrl };
    for (const m of members) {
      this.server.to(m.userId).emit("roomEdited", event);
    }
  }

  /** Notify members when a room is created via REST */
  async emitRoomCreated(room: { id: string; name: string | null; type: string; description?: string | null; avatarUrl?: string | null }, memberIds: string[]) {
    const payload = {
      id: room.id,
      name: room.name,
      type: room.type,
      description: room.description,
      avatar: room.avatarUrl,
      lastMsg: "Chat created",
    };
    for (const userId of memberIds) {
      this.server.to(userId).emit("roomCreated", payload);
    }
  }
}
