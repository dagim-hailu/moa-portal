import { 
  Controller, Get, Post, Put, Delete, Query, Param, Body,
  UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException, ForbiddenException, NotFoundException
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { extname, join } from "path";
import { v2 as cloudinary } from "cloudinary";
import * as streamifier from "streamifier";
import { JwtAuthGuard } from "./auth/jwt.guard";
import { DatabaseService } from "../db/database.service";
import { existsSync, mkdirSync } from "fs";

@Controller("api/chat")
export class ChatController {
  constructor(private readonly database: DatabaseService) {}

  @UseGuards(JwtAuthGuard)
  @Get("history")
  async getHistory(@Req() req: any, @Query("receiverId") receiverId: string) {
    return this.database.getChatHistory(req.user.sub, receiverId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("rooms")
  async getUserRooms(@Req() req: any) {
    return this.database.getUserRooms(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get("rooms/:roomId/messages")
  async getRoomMessages(@Req() req: any, @Param("roomId") roomId: string) {
    const membership = await this.database.assertRoomMember(roomId, req.user.sub);
    if (!membership.ok) {
      if (membership.reason === "ROOM_NOT_FOUND") throw new NotFoundException("Room not found");
      throw new ForbiddenException("Not a room member");
    }
    return this.database.getRoomMessages(roomId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("rooms/:roomId/members")
  async getRoomMembers(@Req() req: any, @Param("roomId") roomId: string) {
    const membership = await this.database.assertRoomMember(roomId, req.user.sub);
    if (!membership.ok) {
      if (membership.reason === "ROOM_NOT_FOUND") throw new NotFoundException("Room not found");
      throw new ForbiddenException("Not a room member");
    }
    return this.database.getRoomMembers(roomId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("rooms")
  async createRoom(@Req() req: any, @Body() body: { name: string; type: string; avatarUrl?: string; description?: string }) {
    const room = await this.database.createRoom({ name: body.name, type: body.type, avatarUrl: body.avatarUrl, description: body.description, createdBy: req.user.sub });
    await this.database.addRoomMember(room.id, req.user.sub, "admin");
    return room;
  }

  @UseGuards(JwtAuthGuard)
  @Put("rooms/:roomId")
  async editRoom(@Req() req: any, @Param("roomId") roomId: string, @Body() body: { name?: string; description?: string; avatarUrl?: string }) {
    return this.database.editRoom(roomId, req.user.sub, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("rooms/:roomId")
  async deleteRoom(@Req() req: any, @Param("roomId") roomId: string) {
    return this.database.softDeleteRoom(roomId, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post("rooms/:roomId/restore")
  async restoreRoom(@Req() req: any, @Param("roomId") roomId: string) {
    return this.database.restoreRoom(roomId, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get("rooms/deleted")
  async getDeletedRooms(@Req() req: any) {
    return this.database.getDeletedRooms(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post("rooms/:roomId/members")
  async addMember(@Req() req: any, @Param("roomId") roomId: string, @Body() body: { userId: string }) {
    const admin = await this.database.assertRoomAdmin(roomId, req.user.sub);
    if (!admin.ok) {
      if (admin.reason === "ROOM_NOT_FOUND") throw new NotFoundException("Room not found");
      throw new ForbiddenException(admin.reason === "NOT_AN_ADMIN" ? "Admin required" : "Not a room member");
    }
    await this.database.addRoomMember(roomId, body.userId);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Delete("rooms/:roomId/members/:userId")
  async removeMember(@Req() req: any, @Param("roomId") roomId: string, @Param("userId") userId: string) {
    const admin = await this.database.assertRoomAdmin(roomId, req.user.sub);
    if (!admin.ok) {
      if (admin.reason === "ROOM_NOT_FOUND") throw new NotFoundException("Room not found");
      throw new ForbiddenException(admin.reason === "NOT_AN_ADMIN" ? "Admin required" : "Not a room member");
    }
    await this.database.removeRoomMember(roomId, userId);
    await this.database.saveChatMessage({
      roomId,
      senderId: req.user.sub,
      messageType: "system",
      content: "User removed from the room.",
    });
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Put("messages/:messageId")
  async editMessage(@Req() req: any, @Param("messageId") messageId: string, @Body() body: { content: string }) {
    return this.database.editMessage(messageId, req.user.sub, body.content);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("messages/:messageId")
  async deleteMessage(@Req() req: any, @Param("messageId") messageId: string) {
    return this.database.softDeleteMessage(messageId, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post("messages/:messageId/restore")
  async restoreMessage(@Req() req: any, @Param("messageId") messageId: string) {
    return this.database.restoreMessage(messageId, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get("messages/deleted")
  async getDeletedMessages(@Req() req: any) {
    return this.database.getDeletedMessages(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post("messages")
  async sendMessage(@Req() req: any, @Body() body: {
    receiverId?: string; roomId?: string; content?: string;
    fileUrl?: string; fileType?: string; messageType?: string; replyToId?: string;
  }) {
    const senderId = req.user.sub;
    const hasReceiver = Boolean(body.receiverId);
    const hasRoom = Boolean(body.roomId);
    if (hasReceiver === hasRoom) throw new BadRequestException("Must specify exactly one of receiverId or roomId");
    if (!body.content && !body.fileUrl) throw new BadRequestException("Message must have content or a file");

    const saved = await this.database.saveChatMessage({
      senderId, receiverId: body.receiverId, roomId: body.roomId,
      content: body.content, fileUrl: body.fileUrl, fileType: body.fileType,
      messageType: body.messageType || "text", replyToId: body.replyToId,
    });
    return saved;
  }

  @UseGuards(JwtAuthGuard)
  @Get("users")
  async listUsers(@Query("q") q?: string) {
    if (q && q.trim().length > 0) return this.database.searchUsers(q);
    return this.database.listAllUsers();
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile/:userId")
  async getUserProfile(@Param("userId") userId: string) {
    return this.database.getUserProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put("profile")
  async updateProfile(@Req() req: any, @Body() body: { fullName?: string; avatarUrl?: string }) {
    return this.database.updateCurrentUserProfile(req.user.sub, body);
  }

  // ── Unread counts & mark-read ──
  @UseGuards(JwtAuthGuard)
  @Get("unread/rooms")
  async getUnreadRooms(@Req() req: any) {
    return this.database.getUnreadMessageCountsForRooms(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get("unread/direct")
  async getUnreadDirect(@Req() req: any) {
    return this.database.getUnreadDirectMessageCounts(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post("rooms/:roomId/read")
  async markRoomRead(@Req() req: any, @Param("roomId") roomId: string) {
    await this.database.markRoomRead(roomId, req.user.sub);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post("direct/:userId/read")
  async markDirectRead(@Req() req: any, @Param("userId") otherUserId: string) {
    await this.database.markDirectRead(req.user.sub, otherUserId);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get("notifications")
  async getNotifications(@Req() req: any) {
    return this.database.getUserNotifications(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get("notifications/unread-count")
  async getUnreadCount(@Req() req: any) {
    return { count: await this.database.getUnreadNotificationCount(req.user.sub) };
  }

  @UseGuards(JwtAuthGuard)
  @Put("notifications/:id/read")
  async markRead(@Param("id") id: string) {
    await this.database.markNotificationRead(id);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Put("notifications/read-all")
  async markAllRead(@Req() req: any) {
    await this.database.markAllNotificationsRead(req.user.sub);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Delete("notifications/:id")
  async deleteNotification(@Param("id") id: string) {
    await this.database.deleteNotification(id);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get("notifications/preferences")
  async getPrefs(@Req() req: any) {
    return this.database.getNotificationPreferences(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Put("notifications/preferences")
  async upsertPrefs(@Req() req: any, @Body() body: any) {
    return this.database.upsertNotificationPreferences(req.user.sub, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post("upload")
  @UseInterceptors(FileInterceptor("file", {
    storage: memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException("No file uploaded");

    if (!process.env.CLOUDINARY_URL) {
      throw new BadRequestException("CLOUDINARY_URL environment variable is missing.");
    }

    const isImage = file.mimetype.startsWith("image/");
    const isAudio = file.mimetype.startsWith("audio/") || file.mimetype.includes("ogg") || file.originalname.endsWith(".webm");
    const fileType = isAudio ? "voice" : isImage ? "image" : "file";
    
    // Cloudinary uses 'video' for audio files, 'image' for images, and 'raw' for everything else
    const resourceType = isAudio ? "video" : isImage ? "image" : "raw";

    let fileUrl: string;
    try {
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const cldStream = cloudinary.uploader.upload_stream(
          { resource_type: resourceType, folder: "moa_chat_uploads" },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(file.buffer).pipe(cldStream);
      });
      fileUrl = uploadResult.secure_url;
    } catch (err: any) {
      console.error("Cloudinary upload failed:", err);
      throw new BadRequestException("Upload failed: " + (err.message || err.toString()));
    }

    return { fileUrl, fileType, originalName: file.originalname, mimeType: file.mimetype, size: file.size };
  }

  @UseGuards(JwtAuthGuard)
  @Get("messages/archived")
  async getArchivedMessages(@Req() req: any) {
    return this.database.getArchivedMessages(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get("pinned")
  async getPinnedConversations(@Req() req: any) {
    return this.database.getPinnedConversations(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post("pinned")
  async pinConversation(@Req() req: any, @Body() body: { conversationId: string }) {
    if (!body.conversationId) throw new BadRequestException("conversationId is required");
    return this.database.pinConversation(req.user.sub, body.conversationId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("pinned/:conversationId")
  async unpinConversation(@Req() req: any, @Param("conversationId") conversationId: string) {
    await this.database.unpinConversation(req.user.sub, conversationId);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get("blocked")
  async getBlockedEntities(@Req() req: any) {
    return this.database.getBlockedEntities(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post("blocked")
  async blockEntity(@Req() req: any, @Body() body: { blockedId: string }) {
    if (!body.blockedId) throw new BadRequestException("blockedId is required");
    return this.database.blockEntity(req.user.sub, body.blockedId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("blocked/:blockedId")
  async unblockEntity(@Req() req: any, @Param("blockedId") blockedId: string) {
    await this.database.unblockEntity(req.user.sub, blockedId);
    return { success: true };
  }
}
