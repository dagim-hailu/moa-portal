import {
  WebSocketGateway, SubscribeMessage, MessageBody,
  ConnectedSocket, WebSocketServer,
  OnGatewayConnection, OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { verifyAccessToken } from "@moa/shared/auth";
import { DatabaseService } from "../db/database.service";

@WebSocketGateway({ cors: { origin: "*" }, maxHttpBufferSize: 10 * 1024 * 1024 })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private userSockets = new Map<string, Set<string>>();

  constructor(private readonly database: DatabaseService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(" ")[1];
      if (!token) throw new UnauthorizedException();
      if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET not configured");
      const payload = await verifyAccessToken(token, process.env.JWT_SECRET);
      client.data.user = payload;
      client.join(payload.sub);
      const users = this.userSockets.get(payload.sub) ?? new Set();
      users.add(client.id);
      this.userSockets.set(payload.sub, users);
      this.server.emit("userStatus", { userId: payload.sub, online: true });
    } catch (e) { client.disconnect(); }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (!user) return;
    const users = this.userSockets.get(user.sub);
    if (users) { users.delete(client.id); if (users.size === 0) { this.userSockets.delete(user.sub); this.server.emit("userStatus", { userId: user.sub, online: false }); } }
  }

  @SubscribeMessage("joinRoom")
  async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string }) {
    const user = client.data.user;
    if (!user) throw new UnauthorizedException();
    const membership = await this.database.assertRoomMember(data.roomId, user.sub);
    if (!membership.ok) throw new ForbiddenException("Not allowed to join this room");
    client.join(`room:${data.roomId}`);
  }

  @SubscribeMessage("leaveRoom")
  handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string }) {
    client.leave(`room:${data.roomId}`);
  }

  @SubscribeMessage("typing")
  handleTyping(@ConnectedSocket() client: Socket, @MessageBody() data: { receiverId?: string; roomId?: string; isTyping: boolean }) {
    const sender = client.data.user; if (!sender) return;
    const payload = { userId: sender.sub, isTyping: data.isTyping };
    if (data.roomId) client.to(`room:${data.roomId}`).emit("userTyping", payload);
    else if (data.receiverId) this.server.to(data.receiverId).emit("userTyping", payload);
  }

  @SubscribeMessage("sendMessage")
  async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() data: {
    receiverId?: string; roomId?: string; content?: string;
    fileUrl?: string; fileType?: string; messageType?: string; replyToId?: string;
    clientMessageId?: string; voiceDuration?: number;
  }) {
    const sender = client.data.user; if (!sender) throw new UnauthorizedException();
    const hasReceiver = Boolean(data.receiverId);
    const hasRoom = Boolean(data.roomId);
    if (hasReceiver === hasRoom) throw new ForbiddenException("Invalid message target");

    // Capture room name for notification use (must be accessible outside the if block)
    let roomName: string | null = null;

    if (data.roomId) {
      const membership = await this.database.assertRoomMember(data.roomId, sender.sub);
      if (!membership.ok) throw new ForbiddenException("Not a room member");
      if (membership.room) roomName = membership.room.name;
      if (membership.room.type === "channel") {
        const role = await this.database.getRoomMemberRole(data.roomId, sender.sub);
        if (role !== "admin") throw new ForbiddenException("Only admins can post in channels");
      }
    } else if (data.receiverId) {
      if (data.receiverId === sender.sub) throw new ForbiddenException("Cannot message yourself");
      const ok = await this.database.userExists(data.receiverId);
      if (!ok) throw new ForbiddenException("Receiver not found");
      const blocked = await this.database.hasBlocked(sender.sub, data.receiverId);
      if (blocked) throw new ForbiddenException("Cannot send message: Blocked");
    }

    const saved = await this.database.saveChatMessage({
      senderId: sender.sub, receiverId: data.receiverId, roomId: data.roomId,
      content: data.content, fileUrl: data.fileUrl, fileType: data.fileType,
      messageType: data.messageType || "text", replyToId: data.replyToId,
      voiceDuration: data.voiceDuration,
    });
    const payload = { ...saved, clientMessageId: data.clientMessageId };
    if (data.roomId) this.server.to(`room:${data.roomId}`).emit("receiveMessage", payload);
    else if (data.receiverId) this.server.to(data.receiverId).emit("receiveMessage", payload);
    this.server.to(sender.sub).emit("messageSent", payload);

    // Create notification for recipient
    const senderName = sender.fullName || sender.email?.split("@")[0] || sender.sub.slice(0, 8);
    if (data.receiverId) {
      const notif = await this.database.createNotification({
        userId: data.receiverId,
        type: "message",
        title: `New message from ${senderName}`,
        body: data.content?.slice(0, 100) || "Attachment",
        data: { senderId: sender.sub, messageId: saved.id },
        conversationId: data.receiverId,
        senderName,
      });
      this.server.to(data.receiverId).emit("newNotification", notif);
    } else if (data.roomId) {
      const members = await this.database.getRoomMembers(data.roomId);
      for (const m of members) {
        if (m.userId === sender.sub) continue;
        const notif = await this.database.createNotification({
          userId: m.userId,
          type: "group_invite",
          title: `New message in ${roomName || "group"}`,
          body: data.content?.slice(0, 100) || "Attachment",
          data: { senderId: sender.sub, roomId: data.roomId, messageId: saved.id },
          conversationId: data.roomId,
          senderName,
        });
        this.server.to(m.userId).emit("newNotification", notif);
      }
    }
  }

  @SubscribeMessage("editMessage")
  async handleEditMessage(@ConnectedSocket() client: Socket, @MessageBody() data: { messageId: string; content: string; roomId?: string; receiverId?: string }) {
    const sender = client.data.user; if (!sender) throw new UnauthorizedException();
    if (data.roomId) {
      const membership = await this.database.assertRoomMember(data.roomId, sender.sub);
      if (!membership.ok) throw new ForbiddenException("Not a room member");
    }
    const updated = await this.database.editMessage(data.messageId, sender.sub, data.content);
    if (!updated) return;
    const payload = { messageId: data.messageId, content: data.content, editedAt: new Date().toISOString() };
    if (data.roomId) this.server.to(`room:${data.roomId}`).emit("messageEdited", payload);
    else if (data.receiverId) this.server.to(data.receiverId).emit("messageEdited", payload);
    this.server.to(sender.sub).emit("messageEdited", payload);
  }

  @SubscribeMessage("deleteMessage")
  async handleDeleteMessage(@ConnectedSocket() client: Socket, @MessageBody() data: { messageId: string; roomId?: string; receiverId?: string }) {
    const sender = client.data.user; if (!sender) throw new UnauthorizedException();
    if (data.roomId) {
      const membership = await this.database.assertRoomMember(data.roomId, sender.sub);
      if (!membership.ok) throw new ForbiddenException("Not a room member");
    }
    const deleted = await this.database.softDeleteMessage(data.messageId, sender.sub);
    if (!deleted) return;
    const payload = { messageId: data.messageId };
    if (data.roomId) this.server.to(`room:${data.roomId}`).emit("messageDeleted", payload);
    else if (data.receiverId) this.server.to(data.receiverId).emit("messageDeleted", payload);
    this.server.to(sender.sub).emit("messageDeleted", payload);
  }

  @SubscribeMessage("restoreMessage")
  async handleRestoreMessage(@ConnectedSocket() client: Socket, @MessageBody() data: { messageId: string }) {
    const sender = client.data.user; if (!sender) throw new UnauthorizedException();
    const restored = await this.database.restoreMessage(data.messageId, sender.sub);
    if (restored) this.server.to(sender.sub).emit("messageRestored", restored);
  }

  @SubscribeMessage("deleteRoom")
  async handleDeleteRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string }) {
    const sender = client.data.user; if (!sender) throw new UnauthorizedException();
    const deleted = await this.database.softDeleteRoom(data.roomId, sender.sub);
    if (!deleted) return;
    // Notify everyone (even if not currently joined)
    const members = await this.database.getRoomMembers(data.roomId);
    for (const m of members) this.server.to(m.userId).emit("roomDeleted", { roomId: data.roomId });
    this.server.to(`room:${data.roomId}`).emit("roomDeleted", { roomId: data.roomId });
  }

  @SubscribeMessage("editRoom")
  async handleEditRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string; name?: string; description?: string; avatarUrl?: string }) {
    const sender = client.data.user; if (!sender) throw new UnauthorizedException();
    const updated = await this.database.editRoom(data.roomId, sender.sub, { name: data.name, description: data.description, avatarUrl: data.avatarUrl });
    if (!updated) return;
    if (updated) this.server.to(`room:${data.roomId}`).emit("roomEdited", updated);
    this.server.to(sender.sub).emit("roomEdited", updated);
  }

  @SubscribeMessage("forwardMessage")
  async handleForwardMessage(@ConnectedSocket() client: Socket, @MessageBody() data: { message: any; targetRoomId?: string; targetUserId?: string }) {
    const sender = client.data.user; if (!sender) throw new UnauthorizedException();
    const hasRoom = Boolean(data.targetRoomId);
    const hasUser = Boolean(data.targetUserId);
    if (hasRoom === hasUser) throw new ForbiddenException("Invalid forward target");

    if (data.targetRoomId) {
      const membership = await this.database.assertRoomMember(data.targetRoomId, sender.sub);
      if (!membership.ok) throw new ForbiddenException("Not a room member");
    } else if (data.targetUserId) {
      if (data.targetUserId === sender.sub) throw new ForbiddenException("Cannot message yourself");
      const ok = await this.database.userExists(data.targetUserId);
      if (!ok) throw new ForbiddenException("Receiver not found");
    }

    const saved = await this.database.saveChatMessage({
      senderId: sender.sub,
      roomId: data.targetRoomId,
      receiverId: data.targetUserId,
      content: data.message?.content ?? undefined,
      fileUrl: data.message?.fileUrl ?? undefined,
      fileType: data.message?.fileType ?? undefined,
      messageType: data.message?.messageType ?? "text",
      replyToId: undefined,
    });

    const forwardPayload = { ...saved, forwardedFrom: data.message?.senderId ?? null };
    if (data.targetRoomId) this.server.to(`room:${data.targetRoomId}`).emit("receiveMessage", forwardPayload);
    else if (data.targetUserId) this.server.to(data.targetUserId).emit("receiveMessage", forwardPayload);
    this.server.to(sender.sub).emit("messageSent", forwardPayload);
  }

  @SubscribeMessage("addReaction")
  handleReaction(@ConnectedSocket() client: Socket, @MessageBody() data: { messageId: string; emoji: string; roomId?: string; receiverId?: string }) {
    const sender = client.data.user; if (!sender) throw new UnauthorizedException();
    const payload = { messageId: data.messageId, userId: sender.sub, emoji: data.emoji };
    if (data.roomId) this.server.to(`room:${data.roomId}`).emit("messageReaction", payload);
    else if (data.receiverId) this.server.to(data.receiverId).emit("messageReaction", payload);
    this.server.to(sender.sub).emit("messageReaction", payload);
  }
}
