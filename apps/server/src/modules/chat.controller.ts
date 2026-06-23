import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname, join } from "path";
import { existsSync, mkdirSync } from "fs";
import { JwtAuthGuard } from "./auth/jwt.guard";
import { DatabaseService } from "../db/database.service";
import { decodeMessageCursor, serializeMessage } from "./chat/chat-cursor.util";
import { ChatGateway } from "./chat.gateway";

const uploadsDir = join(process.cwd(), "public", "uploads");
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

@Controller("api/chat")
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly database: DatabaseService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Get("users")
  async listUsers(@Query("q") q?: string) {
    const rows = q?.trim() ? await this.database.searchUsers(q) : await this.database.listAllUsers();
    return rows;
  }

  @Get("rooms")
  async listRooms(@Req() req: { user: { sub: string } }) {
    return this.database.getUserRooms(req.user.sub);
  }

  @Post("rooms")
  async createRoom(
    @Req() req: { user: { sub: string } },
    @Body() body: { name: string; type: string; description?: string; avatarUrl?: string; memberIds?: string[] },
  ) {
    const room = await this.database.createRoom({
      name: body.name,
      type: body.type,
      description: body.description,
      avatarUrl: body.avatarUrl,
      createdBy: req.user.sub,
    });
    if (!room) throw new BadRequestException("Failed to create room");
    await this.database.addRoomMember(room.id, req.user.sub, "admin");
    for (const memberId of body.memberIds ?? []) {
      if (memberId !== req.user.sub) await this.database.addRoomMember(room.id, memberId, "member");
    }
    const allMembers = [req.user.sub, ...(body.memberIds ?? []).filter(id => id !== req.user.sub)];
    await this.chatGateway.emitRoomCreated(room, allMembers);
    return room;
  }

  @Get("rooms/deleted")
  async deletedRooms(@Req() req: { user: { sub: string } }) {
    return this.database.getDeletedRooms(req.user.sub);
  }

  @Post("rooms/:roomId/restore")
  async restoreRoom(@Req() req: { user: { sub: string } }, @Param("roomId") roomId: string) {
    const restored = await this.database.restoreRoom(roomId, req.user.sub);
    if (!restored) throw new NotFoundException("Room not found or not restorable");
    return restored;
  }

  @Get("rooms/:roomId/messages")
  async getRoomMessages(
    @Req() req: { user: { sub: string } },
    @Param("roomId") roomId: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limitStr?: string,
  ) {
    const membership = await this.database.assertRoomMember(roomId, req.user.sub);
    if (!membership.ok) throw new ForbiddenException(membership.reason);
    const limit = Math.min(Math.max(Number(limitStr) || 50, 1), 100);
    const before = decodeMessageCursor(cursor);
    const page = await this.database.getRoomMessagesPaginated(roomId, limit, before ?? undefined);
    return {
      messages: page.messages.map(serializeMessage),
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
    };
  }

  @Get("rooms/:roomId/members")
  async getRoomMembers(@Req() req: { user: { sub: string } }, @Param("roomId") roomId: string) {
    const membership = await this.database.assertRoomMember(roomId, req.user.sub);
    if (!membership.ok) throw new ForbiddenException(membership.reason);
    return this.database.getRoomMembers(roomId);
  }

  @Post("rooms/:roomId/members")
  async addRoomMember(
    @Req() req: { user: { sub: string } },
    @Param("roomId") roomId: string,
    @Body() body: { userId: string },
  ) {
    const admin = await this.database.assertRoomAdmin(roomId, req.user.sub);
    if (!admin.ok) throw new ForbiddenException(admin.reason);
    if (!(await this.database.userExists(body.userId))) throw new NotFoundException("User not found");
    await this.database.addRoomMember(roomId, body.userId, "member");
    return { ok: true };
  }

  @Delete("rooms/:roomId/members/:userId")
  async removeRoomMember(
    @Req() req: { user: { sub: string } },
    @Param("roomId") roomId: string,
    @Param("userId") userId: string,
  ) {
    const admin = await this.database.assertRoomAdmin(roomId, req.user.sub);
    if (!admin.ok) throw new ForbiddenException(admin.reason);
    await this.database.removeRoomMember(roomId, userId, req.user.sub);
    this.chatGateway.server.to(`room:${roomId}`).emit("rosterUpdated", { roomId, userId, action: "removed" });
    return { ok: true };
  }

  @Put("rooms/:roomId/members/:userId/role")
  async updateRoomMemberRole(
    @Req() req: { user: { sub: string } },
    @Param("roomId") roomId: string,
    @Param("userId") userId: string,
    @Body() body: { role: string },
  ) {
    const admin = await this.database.assertRoomAdmin(roomId, req.user.sub);
    if (!admin.ok) throw new ForbiddenException(admin.reason);
    if (!["admin", "manager", "member"].includes(body.role)) {
      throw new BadRequestException("Invalid role");
    }
    await this.database.updateRoomMemberRole(roomId, userId, body.role, req.user.sub);
    this.chatGateway.server.to(`room:${roomId}`).emit("rosterUpdated", { roomId, userId, role: body.role, action: "role_updated" });
    return { ok: true };
  }

  @Get("departments")
  async listDepartments() {
    return this.database.listDepartments();
  }

  @Get("users/:userId/departments")
  async getUserDepartments(@Param("userId") userId: string) {
    return this.database.getUserDepartments(userId);
  }

  @Put("users/:userId/departments")
  async assignUserDepartments(
    @Req() req: { user: { sub: string } },
    @Param("userId") userId: string,
    @Body() body: { departmentIds: string[] },
  ) {
    const allowed = await this.database.canEditUserDepartments(req.user.sub, userId);
    if (!allowed) throw new ForbiddenException("You are not authorized to edit this user's departments");
    await this.database.assignUserDepartments(userId, body.departmentIds, req.user.sub);
    this.chatGateway.server.emit("userDepartmentsUpdated", { userId, departmentIds: body.departmentIds });
    return { ok: true };
  }


  @Post("rooms/:roomId/read")
  async markRoomRead(@Req() req: { user: { sub: string } }, @Param("roomId") roomId: string) {
    const membership = await this.database.assertRoomMember(roomId, req.user.sub);
    if (!membership.ok) throw new ForbiddenException(membership.reason);
    await this.database.markRoomRead(roomId, req.user.sub);
    return { ok: true };
  }

  @Get("history")
  async getHistory(
    @Req() req: { user: { sub: string } },
    @Query("receiverId") receiverId: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limitStr?: string,
  ) {
    if (!receiverId) throw new BadRequestException("receiverId required");
    const limit = Math.min(Math.max(Number(limitStr) || 50, 1), 100);
    const before = decodeMessageCursor(cursor);
    const page = await this.database.getChatHistoryPaginated(req.user.sub, receiverId, limit, before ?? undefined);
    return {
      messages: page.messages.map(serializeMessage),
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
    };
  }

  @Post("direct/:otherUserId/read")
  async markDirectRead(@Req() req: { user: { sub: string } }, @Param("otherUserId") otherUserId: string) {
    await this.database.markDirectRead(req.user.sub, otherUserId);
    return { ok: true };
  }

  @Get("unread/rooms")
  async unreadRooms(@Req() req: { user: { sub: string } }) {
    return this.database.getUnreadMessageCountsForRooms(req.user.sub);
  }

  @Get("unread/direct")
  async unreadDirect(@Req() req: { user: { sub: string } }) {
    return this.database.getUnreadDirectMessageCounts(req.user.sub);
  }

  @Get("messages/archived")
  async archivedMessages(@Req() req: { user: { sub: string } }) {
    const rows = await this.database.getArchivedMessages(req.user.sub);
    return rows.map(serializeMessage);
  }

  @Get("notifications")
  async notifications(@Req() req: { user: { sub: string } }) {
    return this.database.getUserNotifications(req.user.sub);
  }

  @Get("notifications/unread-count")
  async notificationUnreadCount(@Req() req: { user: { sub: string } }) {
    const count = await this.database.getUnreadNotificationCount(req.user.sub);
    return { count };
  }

  @Put("notifications/read-all")
  async markAllNotificationsRead(@Req() req: { user: { sub: string } }) {
    await this.database.markAllNotificationsRead(req.user.sub);
    return { ok: true };
  }

  @Put("notifications/:id/read")
  async markNotificationRead(@Param("id") id: string) {
    await this.database.markNotificationRead(id);
    return { ok: true };
  }

  @Get("notifications/preferences")
  async notificationPreferences(@Req() req: { user: { sub: string } }) {
    return this.database.getNotificationPreferences(req.user.sub);
  }

  @Put("notifications/preferences")
  async updateNotificationPreferences(
    @Req() req: { user: { sub: string } },
    @Body() body: { messages?: boolean; groups?: boolean; channels?: boolean; mentions?: boolean; sound?: boolean; desktop?: boolean },
  ) {
    return this.database.upsertNotificationPreferences(req.user.sub, body);
  }

  @Get("pinned")
  async pinned(@Req() req: { user: { sub: string } }) {
    return this.database.getPinnedConversations(req.user.sub);
  }

  @Post("pinned")
  async pin(@Req() req: { user: { sub: string } }, @Body() body: { conversationId: string }) {
    await this.database.pinConversation(req.user.sub, body.conversationId);
    return { ok: true };
  }

  @Delete("pinned/:conversationId")
  async unpin(@Req() req: { user: { sub: string } }, @Param("conversationId") conversationId: string) {
    await this.database.unpinConversation(req.user.sub, conversationId);
    return { ok: true };
  }

  @Get("blocked")
  async blocked(@Req() req: { user: { sub: string } }) {
    return this.database.getBlockedEntities(req.user.sub);
  }

  @Post("blocked")
  async block(@Req() req: { user: { sub: string } }, @Body() body: { blockedId: string }) {
    await this.database.blockEntity(req.user.sub, body.blockedId);
    return { ok: true };
  }

  @Delete("blocked/:blockedId")
  async unblock(@Req() req: { user: { sub: string } }, @Param("blockedId") blockedId: string) {
    await this.database.unblockEntity(req.user.sub, blockedId);
    return { ok: true };
  }

  @Get("profile/:userId")
  async getProfile(@Req() req: { user: { sub: string } }, @Param("userId") userId: string) {
    const profile = await this.database.getUserProfile(userId);
    if (!profile) throw new NotFoundException("User not found");
    const canEditDepartments = await this.database.canEditUserDepartments(req.user.sub, userId);
    return { ...profile, canEditDepartments };
  }

  @Put("profile")
  async updateProfile(
    @Req() req: { user: { sub: string } },
    @Body() body: { fullName?: string; avatarUrl?: string; username?: string; phoneNumber?: string | null },
  ) {
    const updated = await this.database.updateCurrentUserProfile(req.user.sub, body);
    if (!updated) throw new BadRequestException("Nothing to update");
    return updated;
  }

  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: uploadsDir,
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 100 * 1024 * 1024 },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException("No file uploaded");
    const fileUrl = `/uploads/${file.filename}`;
    const mime = file.mimetype || "";
    let fileType = "file";
    if (mime.startsWith("image/")) fileType = "image";
    else if (mime.startsWith("video/")) fileType = "video";
    else if (mime.startsWith("audio/")) fileType = "audio";
    return { fileUrl, fileType, fileName: file.originalname };
  }
}
