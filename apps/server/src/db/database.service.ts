import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { and, desc, eq, gte, isNull, not, or, sql, lt } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  applications,
  authSessions,
  auditLogs,
  contactMessages,
  portalAnnouncements,
  userApplications,
  users,
  chatMessages,
  chatRooms,
  chatRoomMembers,
  chatDirectReadStatus,
  notifications,
  notificationPreferences,
  chatPinnedConversations,
  chatBlockedEntities,
  departments,
  userDepartments,
  chatMessageDeletions,
  chatAuditEvents,
} from "@moa/shared/db";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: pg.Pool | null = null;
  private schemaObj = {
    users, applications, userApplications, authSessions, auditLogs,
    contactMessages, portalAnnouncements, chatMessages, chatRooms,
    chatRoomMembers, chatDirectReadStatus, notifications, notificationPreferences,
    chatPinnedConversations, chatBlockedEntities, departments, userDepartments,
    chatMessageDeletions, chatAuditEvents,
  };
  db!: NodePgDatabase<typeof this.schemaObj>;

  async onModuleInit() {
    const url = process.env.DATABASE_URL ?? "postgres://moa:moa@localhost:5433/moa_portal";
    this.pool = new pg.Pool({ connectionString: url });
    this.db = drizzle(this.pool, { schema: this.schemaObj });
  }

  async onModuleDestroy() {
    await this.pool?.end();
  }

  async findUserByEmail(email: string) {
    const [user] = await this.db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    return user ?? null;
  }

  async findUserByUsername(username: string) {
    const [user] = await this.db.select().from(users).where(eq(users.username, username.toLowerCase())).limit(1);
    return user ?? null;
  }

  async findUserByIdentifier(identifier: string) {
    const normalized = identifier.trim().toLowerCase();
    return this.db.query.users.findFirst({
      where: (u, { or, eq }) => or(eq(u.email, normalized), eq(u.username, normalized)),
    });
  }

  async createUser(input: {
    email: string;
    username: string;
    phoneNumber?: string;
    passwordHash: string;
    fullName: string;
    role: "admin" | "supervisor" | "user";
    locale?: string;
  }) {
    const [created] = await this.db
      .insert(users)
      .values({
        email: input.email.toLowerCase(),
        username: input.username.toLowerCase(),
        passwordHash: input.passwordHash,
        fullName: input.fullName,
        phoneNumber: input.phoneNumber ?? null,
        role: input.role,
        locale: input.locale ?? "en",
      })
      .returning();
    return created;
  }

  async findUserById(id: string) {
    return this.db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, id),
    });
  }

  async listUsers() {
    return this.db.select().from(users).orderBy(users.fullName);
  }

  async createAuthSession(input: {
    id: string;
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
  }) {
    const [created] = await this.db
      .insert(authSessions)
      .values({
        id: input.id,
        userId: input.userId,
        refreshTokenHash: input.refreshTokenHash,
        expiresAt: input.expiresAt,
      })
      .returning();
    return created;
  }

  async findActiveAuthSession(id: string) {
    return this.db.query.authSessions.findFirst({
      where: (s, { and, eq, isNull, gte }) =>
        and(eq(s.id, id), isNull(s.revokedAt), gte(s.expiresAt, new Date())),
    });
  }

  async rotateAuthSession(id: string, refreshTokenHash: string, expiresAt: Date) {
    const [updated] = await this.db
      .update(authSessions)
      .set({
        refreshTokenHash,
        expiresAt,
        lastUsedAt: new Date(),
        revokedAt: null,
      })
      .where(eq(authSessions.id, id))
      .returning();
    return updated ?? null;
  }

  async revokeAuthSession(id: string) {
    const [updated] = await this.db
      .update(authSessions)
      .set({ revokedAt: new Date(), lastUsedAt: new Date() })
      .where(eq(authSessions.id, id))
      .returning();
    return Boolean(updated);
  }

  async listApplications() {
    const rows = await this.db.select().from(applications).orderBy(applications.sidebarOrder);
    const counts = await this.db
      .select({
        applicationId: userApplications.applicationId,
        count: sql<number>`count(*)::int`,
      })
      .from(userApplications)
      .groupBy(userApplications.applicationId);

    const countMap = new Map(counts.map((row) => [row.applicationId, row.count]));

    return rows.map((app) => ({
      ...app,
      assignedUsers: countMap.get(app.id) ?? 0,
    }));
  }

  async listMyApps(userId: string) {
    return this.db
      .select({
        id: applications.id,
        slug: applications.slug,
        nameEn: applications.nameEn,
        nameAm: applications.nameAm,
        descriptionEn: applications.descriptionEn,
        descriptionAm: applications.descriptionAm,
        routePath: applications.routePath,
        isActive: applications.isActive,
        searchEnabled: applications.searchEnabled,
        sidebarOrder: applications.sidebarOrder,
      })
      .from(userApplications)
      .innerJoin(applications, eq(userApplications.applicationId, applications.id))
      .where(and(eq(userApplications.userId, userId), eq(applications.isActive, true)))
      .orderBy(applications.sidebarOrder);
  }

  async getUserAppSlugs(userId: string) {
    const rows = await this.listMyApps(userId);
    return rows.map((row) => row.slug);
  }

  async getAllActiveAppSlugs() {
    const rows = await this.db
      .select({ slug: applications.slug })
      .from(applications)
      .where(eq(applications.isActive, true))
      .orderBy(applications.sidebarOrder);
    return rows.map((row) => row.slug);
  }

  async listAssignmentsForSlug(slug: string) {
    const [app] = await this.db.select().from(applications).where(eq(applications.slug, slug)).limit(1);
    if (!app) {
      return [];
    }

    return this.db
      .select({
        id: userApplications.id,
        applicationSlug: sql<string>`${slug}`,
        userId: userApplications.userId,
        assignedAt: userApplications.assignedAt,
      })
      .from(userApplications)
      .where(eq(userApplications.applicationId, app.id));
  }

  async listAuditLogs() {
    return this.db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
  }

  async insertAudit(entry: {
    actorUserId?: string;
    action: string;
    targetType: string;
    targetId: string;
    details?: Record<string, unknown>;
  }) {
    await this.db.insert(auditLogs).values({
      actorUserId: entry.actorUserId ?? null,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      details: entry.details ?? {},
    });
  }

  async registerApplication(input: {
    slug: string;
    nameEn: string;
    nameAm: string;
    descriptionEn: string;
    descriptionAm: string;
    routePath: string;
    searchEnabled: boolean;
    actorUserId?: string;
  }) {
    const [created] = await this.db
      .insert(applications)
      .values({
        slug: input.slug,
        nameEn: input.nameEn,
        nameAm: input.nameAm,
        descriptionEn: input.descriptionEn,
        descriptionAm: input.descriptionAm,
        routePath: input.routePath,
        searchEnabled: input.searchEnabled,
        isActive: true,
      })
      .returning();

    await this.insertAudit({
      actorUserId: input.actorUserId,
      action: "APP_REGISTERED",
      targetType: "application",
      targetId: input.slug,
      details: { routePath: input.routePath },
    });

    return { ...created, assignedUsers: 0 };
  }

  async updateApplication(input: {
    id: string;
    slug: string;
    nameEn: string;
    nameAm: string;
    descriptionEn: string;
    descriptionAm: string;
    routePath: string;
    searchEnabled: boolean;
    actorUserId?: string;
  }) {
    const [updated] = await this.db
      .update(applications)
      .set({
        slug: input.slug,
        nameEn: input.nameEn,
        nameAm: input.nameAm,
        descriptionEn: input.descriptionEn,
        descriptionAm: input.descriptionAm,
        routePath: input.routePath,
        searchEnabled: input.searchEnabled,
      })
      .where(eq(applications.id, input.id))
      .returning();

    if (updated) {
      await this.insertAudit({
        actorUserId: input.actorUserId,
        action: "APP_UPDATED",
        targetType: "application",
        targetId: input.slug,
        details: { routePath: input.routePath },
      });
    }

    // Get count
    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(userApplications)
      .where(eq(userApplications.applicationId, input.id));

    return { ...updated, assignedUsers: countRow?.count ?? 0 };
  }

  async updateUser(input: {
    id: string;
    email?: string;
    username?: string;
    fullName?: string;
    role?: "admin" | "supervisor" | "user";
    isActive?: boolean;
    actorUserId?: string;
  }) {
    const updateData: any = {};
    if (input.email) updateData.email = input.email.toLowerCase();
    if (input.username) updateData.username = input.username.toLowerCase();
    if (input.fullName) updateData.fullName = input.fullName;
    if (input.role) updateData.role = input.role;
    if (typeof input.isActive === "boolean") updateData.isActive = input.isActive;

    const [updated] = await this.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, input.id))
      .returning();

    if (updated) {
      await this.insertAudit({
        actorUserId: input.actorUserId,
        action: "USER_UPDATED",
        targetType: "user",
        targetId: input.id,
        details: updateData,
      });
    }
    return updated;
  }

  async toggleApplication(slug: string, isActive: boolean, actorUserId?: string) {
    const [updated] = await this.db
      .update(applications)
      .set({ isActive })
      .where(eq(applications.slug, slug))
      .returning();

    if (updated) {
      await this.insertAudit({
        actorUserId,
        action: "APP_TOGGLED",
        targetType: "application",
        targetId: slug,
        details: { isActive },
      });
    }

    return Boolean(updated);
  }

  async assignUser(slug: string, userId: string, actorUserId?: string) {
    const [app] = await this.db.select().from(applications).where(eq(applications.slug, slug)).limit(1);
    if (!app) {
      throw new Error("Application not found");
    }

    const [existing] = await this.db
      .select()
      .from(userApplications)
      .where(and(eq(userApplications.applicationId, app.id), eq(userApplications.userId, userId)))
      .limit(1);

    if (existing) {
      return {
        id: existing.id,
        applicationSlug: slug,
        userId: existing.userId,
        assignedAt: existing.assignedAt.toISOString(),
      };
    }

    const [created] = await this.db
      .insert(userApplications)
      .values({ applicationId: app.id, userId })
      .returning();

    await this.insertAudit({
      actorUserId,
      action: "USER_ASSIGNED",
      targetType: "application",
      targetId: slug,
      details: { userId },
    });

    return {
      id: created.id,
      applicationSlug: slug,
      userId: created.userId,
      assignedAt: created.assignedAt.toISOString(),
    };
  }

  async revokeUser(slug: string, userId: string, actorUserId?: string) {
    const [app] = await this.db.select().from(applications).where(eq(applications.slug, slug)).limit(1);
    if (!app) {
      return false;
    }

    const result = await this.db
      .delete(userApplications)
      .where(and(eq(userApplications.applicationId, app.id), eq(userApplications.userId, userId)))
      .returning();

    if (result.length > 0) {
      await this.insertAudit({
        actorUserId,
        action: "USER_REVOKED",
        targetType: "application",
        targetId: slug,
        details: { userId },
      });
    }

    return result.length > 0;
  }

  async submitContactMessage(input: { fullName: string; email: string; message: string }) {
    const [created] = await this.db.insert(contactMessages).values(input).returning();
    return created;
  }

  async listAnnouncements() {
    return this.db
      .select()
      .from(portalAnnouncements)
      .where(eq(portalAnnouncements.isActive, true))
      .orderBy(desc(portalAnnouncements.createdAt));
  }

  async saveAuthSession(session: any) {
    const [updated] = await this.db
      .insert(authSessions)
      .values(session)
      .onConflictDoUpdate({
        target: authSessions.id,
        set: session,
      })
      .returning();
    return updated;
  }

  async saveChatMessage(input: {
    senderId: string;
    receiverId?: string;
    roomId?: string;
    content?: string;
    fileUrl?: string;
    fileType?: string;
    messageType?: string;
    replyToId?: string;
    voiceDuration?: number;
  }) {
    const hasReceiver = Boolean(input.receiverId);
    const hasRoom = Boolean(input.roomId);
    if (hasReceiver === hasRoom) {
      throw new Error("Message must target exactly one of receiverId or roomId");
    }
    const hasContent = input.content && input.content.trim().length > 0;
    const hasFile = !!input.fileUrl;
    if (!hasContent && !hasFile) {
      throw new Error("Message must have content or a file attachment");
    }
    const [created] = await this.db
      .insert(chatMessages)
      .values({
        senderId: input.senderId,
        receiverId: input.receiverId ?? null,
        roomId: input.roomId ?? null,
        content: input.content ?? null,
        fileUrl: input.fileUrl ?? null,
        fileType: input.fileType ?? null,
        messageType: input.messageType ?? "text",
        voiceDuration: input.voiceDuration ?? null,
        replyToId: input.replyToId ?? null,
      })
      .returning();
    return created;
  }

  async roomExistsAndActive(roomId: string) {
    const [room] = await this.db
      .select({ id: chatRooms.id, deletedAt: chatRooms.deletedAt, type: chatRooms.type, name: chatRooms.name })
      .from(chatRooms)
      .where(eq(chatRooms.id, roomId))
      .limit(1);
    if (!room || room.deletedAt) return null;
    return room;
  }

  async isRoomMember(roomId: string, userId: string) {
    const [row] = await this.db
      .select({ userId: chatRoomMembers.userId })
      .from(chatRoomMembers)
      .where(
        and(
          eq(chatRoomMembers.roomId, roomId),
          eq(chatRoomMembers.userId, userId),
          isNull(chatRoomMembers.deletedAt),
        ),
      )
      .limit(1);
    return Boolean(row);
  }

  async getRoomMemberRole(roomId: string, userId: string) {
    const [row] = await this.db
      .select({ role: chatRoomMembers.role })
      .from(chatRoomMembers)
      .where(
        and(
          eq(chatRoomMembers.roomId, roomId),
          eq(chatRoomMembers.userId, userId),
          isNull(chatRoomMembers.deletedAt),
        ),
      )
      .limit(1);
    return row?.role ?? null;
  }

  async assertRoomMember(roomId: string, userId: string) {
    const room = await this.roomExistsAndActive(roomId);
    if (!room) return { ok: false as const, reason: "ROOM_NOT_FOUND" as const };
    const member = await this.isRoomMember(roomId, userId);
    if (!member) return { ok: false as const, reason: "NOT_A_MEMBER" as const };
    return { ok: true as const, room };
  }

  async assertRoomAdmin(roomId: string, userId: string) {
    const membership = await this.assertRoomMember(roomId, userId);
    if (!membership.ok) return membership;
    const role = await this.getRoomMemberRole(roomId, userId);
    if (role !== "admin") return { ok: false as const, reason: "NOT_AN_ADMIN" as const };
    return { ok: true as const, room: membership.room };
  }

  async userExists(userId: string) {
    const [row] = await this.db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
    return Boolean(row);
  }

  async getChatHistory(userA: string, userB: string, limit = 100) {
    const rows = await this.db
      .select()
      .from(chatMessages)
      .where(
        and(
          isNull(chatMessages.roomId),
          isNull(chatMessages.deletedAt),
          or(
            and(eq(chatMessages.senderId, userA), eq(chatMessages.receiverId, userB)),
            and(eq(chatMessages.senderId, userB), eq(chatMessages.receiverId, userA)),
          ),
        ),
      )
      .orderBy(chatMessages.createdAt)
      .limit(limit);
    return rows;
  }

  async getRoomMessages(roomId: string, limit = 100) {
    const rows = await this.db
      .select()
      .from(chatMessages)
      .where(and(eq(chatMessages.roomId, roomId), isNull(chatMessages.deletedAt)))
      .orderBy(chatMessages.createdAt)
      .limit(limit);
    return rows;
  }

  async getRoomMessagesPaginated(
    roomId: string,
    limit = 50,
    before?: { createdAt: string; id: string },
  ) {
    let where = and(eq(chatMessages.roomId, roomId), isNull(chatMessages.deletedAt));
    if (before) {
      const cursorDate = new Date(before.createdAt);
      where = and(
        where,
        or(
          lt(chatMessages.createdAt, cursorDate),
          and(eq(chatMessages.createdAt, cursorDate), lt(chatMessages.id, before.id)),
        ),
      );
    }
    const rows = await this.db
      .select()
      .from(chatMessages)
      .where(where)
      .orderBy(desc(chatMessages.createdAt), desc(chatMessages.id))
      .limit(limit + 1);
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const oldest = page[page.length - 1];
    return {
      messages: [...page].reverse(),
      nextCursor: hasMore && oldest
        ? Buffer.from(JSON.stringify({ createdAt: oldest.createdAt.toISOString(), id: oldest.id }), "utf8").toString("base64url")
        : null,
      hasMore,
    };
  }

  async getChatHistoryPaginated(
    userA: string,
    userB: string,
    limit = 50,
    before?: { createdAt: string; id: string },
  ) {
    let where = and(
      isNull(chatMessages.roomId),
      isNull(chatMessages.deletedAt),
      or(
        and(eq(chatMessages.senderId, userA), eq(chatMessages.receiverId, userB)),
        and(eq(chatMessages.senderId, userB), eq(chatMessages.receiverId, userA)),
      ),
    );
    if (before) {
      const cursorDate = new Date(before.createdAt);
      where = and(
        where,
        or(
          lt(chatMessages.createdAt, cursorDate),
          and(eq(chatMessages.createdAt, cursorDate), lt(chatMessages.id, before.id)),
        ),
      );
    }
    const rows = await this.db
      .select()
      .from(chatMessages)
      .where(where)
      .orderBy(desc(chatMessages.createdAt), desc(chatMessages.id))
      .limit(limit + 1);
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const oldest = page[page.length - 1];
    return {
      messages: [...page].reverse(),
      nextCursor: hasMore && oldest
        ? Buffer.from(JSON.stringify({ createdAt: oldest.createdAt.toISOString(), id: oldest.id }), "utf8").toString("base64url")
        : null,
      hasMore,
    };
  }

  async editMessage(messageId: string, userId: string, content: string) {
    const [updated] = await this.db
      .update(chatMessages)
      .set({ content, editedAt: new Date() })
      .where(and(eq(chatMessages.id, messageId), eq(chatMessages.senderId, userId)))
      .returning();
    return updated ?? null;
  }

  async softDeleteMessage(messageId: string, userId: string) {
    const [updated] = await this.db
      .update(chatMessages)
      .set({ deletedAt: new Date() })
      .where(and(eq(chatMessages.id, messageId), eq(chatMessages.senderId, userId)))
      .returning();
    return updated ?? null;
  }

  async getArchivedMessages(userId: string) {
    return await this.db
      .select()
      .from(chatMessages)
      .where(and(not(isNull(chatMessages.deletedAt)), eq(chatMessages.senderId, userId)))
      .orderBy(desc(chatMessages.deletedAt));
  }

  async pinConversation(userId: string, conversationId: string) {
    const [pinned] = await this.db
      .insert(chatPinnedConversations)
      .values({ userId, conversationId })
      .onConflictDoNothing()
      .returning();
    return pinned;
  }

  async unpinConversation(userId: string, conversationId: string) {
    await this.db
      .delete(chatPinnedConversations)
      .where(and(eq(chatPinnedConversations.userId, userId), eq(chatPinnedConversations.conversationId, conversationId)));
  }

  async getPinnedConversations(userId: string) {
    return await this.db
      .select()
      .from(chatPinnedConversations)
      .where(eq(chatPinnedConversations.userId, userId));
  }

  async blockEntity(blockerId: string, blockedId: string) {
    const [blocked] = await this.db
      .insert(chatBlockedEntities)
      .values({ blockerId, blockedId })
      .onConflictDoNothing()
      .returning();
    return blocked;
  }

  async unblockEntity(blockerId: string, blockedId: string) {
    await this.db
      .delete(chatBlockedEntities)
      .where(and(eq(chatBlockedEntities.blockerId, blockerId), eq(chatBlockedEntities.blockedId, blockedId)));
  }

  async getBlockedEntities(blockerId: string) {
    return await this.db
      .select()
      .from(chatBlockedEntities)
      .where(eq(chatBlockedEntities.blockerId, blockerId));
  }

  async hasBlocked(userA: string, userB: string) {
    const rows = await this.db
      .select({ id: chatBlockedEntities.id })
      .from(chatBlockedEntities)
      .where(or(
        and(eq(chatBlockedEntities.blockerId, userA), eq(chatBlockedEntities.blockedId, userB)),
        and(eq(chatBlockedEntities.blockerId, userB), eq(chatBlockedEntities.blockedId, userA))
      ))
      .limit(1);
    return rows.length > 0;
  }

  async restoreMessage(messageId: string, userId: string) {
    const [updated] = await this.db
      .update(chatMessages)
      .set({ deletedAt: null })
      .where(and(eq(chatMessages.id, messageId), eq(chatMessages.senderId, userId)))
      .returning();
    return updated ?? null;
  }

  async getDeletedMessages(userId: string, limit = 50) {
    return this.db
      .select()
      .from(chatMessages)
      .where(and(eq(chatMessages.senderId, userId), sql`${chatMessages.deletedAt} IS NOT NULL`))
      .orderBy(desc(chatMessages.deletedAt))
      .limit(limit);
  }

  async createRoom(input: { name?: string; type: string; avatarUrl?: string; description?: string; createdBy?: string }) {
    const [created] = await this.db
      .insert(chatRooms)
      .values({ name: input.name ?? null, type: input.type, avatarUrl: input.avatarUrl ?? null, description: input.description ?? null, createdBy: input.createdBy ?? null })
      .returning();
    return created;
  }

  async editRoom(roomId: string, actorUserId: string, input: { name?: string; description?: string; avatarUrl?: string }) {
    const [room] = await this.db.select({ createdBy: chatRooms.createdBy }).from(chatRooms).where(eq(chatRooms.id, roomId)).limit(1);
    if (!room) return null;
    const isAdmin = await this.db
      .select({ role: chatRoomMembers.role })
      .from(chatRoomMembers)
      .where(and(eq(chatRoomMembers.roomId, roomId), eq(chatRoomMembers.userId, actorUserId)))
      .limit(1);
    if (!isAdmin.length || (isAdmin[0].role !== "admin" && room.createdBy !== actorUserId)) return null;

    const data: Record<string, unknown> = { editedAt: new Date() };
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl;
    const [updated] = await this.db.update(chatRooms).set(data).where(eq(chatRooms.id, roomId)).returning();
    return updated ?? null;
  }

  async softDeleteRoom(roomId: string, actorUserId: string) {
    const [room] = await this.db.select({ createdBy: chatRooms.createdBy, isSystem: chatRooms.isSystem }).from(chatRooms).where(eq(chatRooms.id, roomId)).limit(1);
    if (!room || room.isSystem) return null;
    const isAdmin = await this.db
      .select({ role: chatRoomMembers.role })
      .from(chatRoomMembers)
      .where(and(eq(chatRoomMembers.roomId, roomId), eq(chatRoomMembers.userId, actorUserId)))
      .limit(1);
    if (!isAdmin.length || (isAdmin[0].role !== "admin" && room.createdBy !== actorUserId)) return null;

    const [updated] = await this.db.update(chatRooms).set({ deletedAt: new Date() }).where(eq(chatRooms.id, roomId)).returning();
    return updated ?? null;
  }

  async restoreRoom(roomId: string, actorUserId: string) {
    const [room] = await this.db.select({ createdBy: chatRooms.createdBy }).from(chatRooms).where(eq(chatRooms.id, roomId)).limit(1);
    if (!room || room.createdBy !== actorUserId) return null;
    const [updated] = await this.db.update(chatRooms).set({ deletedAt: null }).where(eq(chatRooms.id, roomId)).returning();
    return updated ?? null;
  }

  async getDeletedRooms(userId: string) {
    return this.db
      .select({
        id: chatRooms.id,
        name: chatRooms.name,
        type: chatRooms.type,
        avatarUrl: chatRooms.avatarUrl,
        description: chatRooms.description,
        deletedAt: chatRooms.deletedAt,
        createdAt: chatRooms.createdAt,
      })
      .from(chatRooms)
      .where(and(sql`${chatRooms.deletedAt} IS NOT NULL`, eq(chatRooms.createdBy, userId)))
      .orderBy(desc(chatRooms.deletedAt))
      .limit(50);
  }

  async addRoomMember(roomId: string, userId: string, role = "member") {
    await this.db
      .insert(chatRoomMembers)
      .values({ roomId, userId, role })
      .onConflictDoNothing();
  }

  async updateRoomMemberRole(roomId: string, userId: string, role: string, actorId?: string) {
    await this.db
      .update(chatRoomMembers)
      .set({ role })
      .where(and(eq(chatRoomMembers.roomId, roomId), eq(chatRoomMembers.userId, userId)));

    if (actorId) {
      await this.db.insert(chatAuditEvents).values({
        roomId,
        eventType: "role_changed",
        actorId,
        targetUserId: userId,
        payload: { newRole: role },
      });
    }
  }

  async removeRoomMember(roomId: string, userId: string, actorId?: string) {
    await this.db
      .delete(chatRoomMembers)
      .where(and(eq(chatRoomMembers.roomId, roomId), eq(chatRoomMembers.userId, userId)));

    if (actorId) {
      await this.db.insert(chatAuditEvents).values({
        roomId,
        eventType: "member_removed",
        actorId,
        targetUserId: userId,
        payload: { removedUserId: userId },
      });

      const [targetUser] = await this.db.select().from(users).where(eq(users.id, userId));
      const [adminUser] = await this.db.select().from(users).where(eq(users.id, actorId));
      if (targetUser && adminUser) {
        await this.db.insert(chatMessages).values({
          roomId,
          senderId: actorId,
          messageType: "system",
          content: `${targetUser.fullName} was removed by ${adminUser.fullName}`,
        });
      }
    }
  }

  async assignUserDepartments(userId: string, departmentIds: string[], assignedBy?: string) {
    await this.db.delete(userDepartments).where(eq(userDepartments.userId, userId));

    if (departmentIds.length > 0) {
      const values = departmentIds.map((deptId) => ({
        userId,
        departmentId: deptId,
        assignedBy: assignedBy ?? null,
      }));
      await this.db.insert(userDepartments).values(values);
    }

    const allDepts = await this.db.select().from(departments);
    for (const dept of allDepts) {
      const shouldBeInDept = departmentIds.includes(dept.id);
      let [room] = await this.db
        .select()
        .from(chatRooms)
        .where(
          and(
            eq(chatRooms.departmentId, dept.id),
            eq(chatRooms.isSystem, true),
            eq(chatRooms.systemType, "department")
          )
        )
        .limit(1);

      if (!room && shouldBeInDept) {
        const [newRoom] = await this.db
          .insert(chatRooms)
          .values({
            name: `Department: ${dept.nameEn}`,
            type: "group",
            isSystem: true,
            systemType: "department",
            departmentId: dept.id,
            createdBy: assignedBy ?? null,
          })
          .returning();
        room = newRoom;
      }

      if (room) {
        if (shouldBeInDept) {
          await this.addRoomMember(room.id, userId, "member");
        } else {
          await this.db
            .delete(chatRoomMembers)
            .where(and(eq(chatRoomMembers.roomId, room.id), eq(chatRoomMembers.userId, userId)));
        }
      }
    }
  }

  async listDepartments() {
    return this.db.select().from(departments).orderBy(departments.nameEn);
  }

  async getUserDepartments(userId: string) {
    return this.db
      .select({
        departmentId: userDepartments.departmentId,
      })
      .from(userDepartments)
      .where(eq(userDepartments.userId, userId));
  }


  async getRoomMembers(roomId: string) {
    return this.db
      .select({ userId: chatRoomMembers.userId, role: chatRoomMembers.role, joinedAt: chatRoomMembers.joinedAt })
      .from(chatRoomMembers)
      .where(and(eq(chatRoomMembers.roomId, roomId), isNull(chatRoomMembers.deletedAt)));
  }

  async getUserRooms(userId: string) {
    return this.db
      .select({
        id: chatRooms.id,
        name: chatRooms.name,
        type: chatRooms.type,
        avatarUrl: chatRooms.avatarUrl,
        description: chatRooms.description,
        createdBy: chatRooms.createdBy,
        createdAt: chatRooms.createdAt,
      })
      .from(chatRoomMembers)
      .innerJoin(chatRooms, eq(chatRoomMembers.roomId, chatRooms.id))
      .where(and(eq(chatRoomMembers.userId, userId), isNull(chatRooms.deletedAt)))
      .orderBy(chatRooms.createdAt);
  }

  async listAllUsers() {
    return this.db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        fullName: users.fullName,
        phoneNumber: users.phoneNumber,
        role: users.role,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .orderBy(users.fullName);
  }

  async searchUsers(query: string, limit = 50) {
    const q = query.trim().toLowerCase();
    if (!q) return this.listAllUsers();

    const like = `%${q}%`;
    return this.db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        fullName: users.fullName,
        phoneNumber: users.phoneNumber,
        role: users.role,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(
        or(
          sql`lower(${users.fullName}) like ${like}`,
          sql`lower(${users.email}) like ${like}`,
          sql`lower(${users.username}) like ${like}`,
          sql`coalesce(${users.phoneNumber}, '') like ${like}`,
        ),
      )
      .orderBy(users.fullName)
      .limit(limit);
  }

  async createNotification(input: { userId: string; type: string; title: string; body?: string; data?: Record<string, unknown>; conversationId?: string; senderName?: string }) {
    const [created] = await this.db
      .insert(notifications)
      .values({
        userId: input.userId, type: input.type, title: input.title,
        body: input.body, data: input.data ?? {},
        conversationId: input.conversationId, senderName: input.senderName,
      })
      .returning();
    return created;
  }

  async getUserNotifications(userId: string, limit = 50) {
    return this.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async getUnreadNotificationCount(userId: string) {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    return row?.count ?? 0;
  }

  async markNotificationRead(notificationId: string) {
    await this.db.update(notifications).set({ read: true }).where(eq(notifications.id, notificationId));
  }

  async markAllNotificationsRead(userId: string) {
    await this.db.update(notifications).set({ read: true }).where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  }

  async deleteNotification(notificationId: string) {
    await this.db.delete(notifications).where(eq(notifications.id, notificationId));
  }

  async getNotificationPreferences(userId: string) {
    const [pref] = await this.db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
    return pref ?? null;
  }

  async upsertNotificationPreferences(userId: string, input: { messages?: boolean; groups?: boolean; channels?: boolean; mentions?: boolean; sound?: boolean; desktop?: boolean }) {
    const [pref] = await this.db
      .insert(notificationPreferences)
      .values({ userId, ...input })
      .onConflictDoUpdate({ target: notificationPreferences.userId, set: { ...input, updatedAt: new Date() } })
      .returning();
    return pref;
  }

  async getUserProfile(userId: string) {
    const [user] = await this.db
      .select({ id: users.id, email: users.email, username: users.username, fullName: users.fullName, role: users.role, avatarUrl: users.avatarUrl, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) return null;
    const sharedMedia = await this.db
      .select()
      .from(chatMessages)
      .where(and(eq(chatMessages.senderId, userId), sql`${chatMessages.fileUrl} IS NOT NULL`, isNull(chatMessages.deletedAt)))
      .orderBy(desc(chatMessages.createdAt))
      .limit(20);
    const groupsCount = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(chatRoomMembers)
      .innerJoin(chatRooms, eq(chatRoomMembers.roomId, chatRooms.id))
      .where(and(eq(chatRoomMembers.userId, userId), eq(chatRooms.type, "group"), isNull(chatRooms.deletedAt)));
    return { ...user, sharedMedia, groupsCount: groupsCount[0]?.count ?? 0 };
  }

  // ── Profile Update ──
  async updateCurrentUserProfile(userId: string, input: { fullName?: string; avatarUrl?: string; passwordHash?: string; username?: string; phoneNumber?: string | null }) {
    const data: Record<string, unknown> = {};
    if (input.fullName !== undefined) data.fullName = input.fullName;
    if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl;
    if (input.passwordHash !== undefined) data.passwordHash = input.passwordHash;
    if (input.username !== undefined) data.username = input.username;
    if ("phoneNumber" in input) data.phoneNumber = input.phoneNumber ?? null;
    if (Object.keys(data).length === 0) return null;
    const [updated] = await this.db.update(users).set(data).where(eq(users.id, userId)).returning();
    return updated ?? null;
  }

  // ── Unread Message Counts ──
  async getUnreadMessageCountsForRooms(userId: string): Promise<Array<{ roomId: string; count: number }>> {
    const rows = await this.db
      .select({
        roomId: chatRoomMembers.roomId,
        count: sql<number>`count(*)::int`,
      })
      .from(chatRoomMembers)
      .innerJoin(chatMessages, eq(chatMessages.roomId, chatRoomMembers.roomId))
      .where(
        and(
          eq(chatRoomMembers.userId, userId),
          not(eq(chatMessages.senderId, userId)), // exclude own messages – count only messages from others
          isNull(chatMessages.deletedAt),
          sql`${chatMessages.createdAt} > COALESCE(${chatRoomMembers.lastReadAt}, '1970-01-01'::timestamp)`,
        ),
      )
      .groupBy(chatRoomMembers.roomId);
    return rows;
  }

  async getUnreadDirectMessageCounts(userId: string): Promise<Array<{ otherUserId: string; count: number }>> {
    const rows = await this.db
      .select({
        otherUserId: chatMessages.senderId,
        count: sql<number>`count(*)::int`,
      })
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.receiverId, userId),
          isNull(chatMessages.roomId),
          isNull(chatMessages.deletedAt),
          sql`${chatMessages.createdAt} > COALESCE((
            SELECT ${chatDirectReadStatus.lastReadAt} FROM ${chatDirectReadStatus}
            WHERE ${chatDirectReadStatus.userId} = ${userId}
            AND ${chatDirectReadStatus.otherUserId} = ${chatMessages.senderId}
          ), '1970-01-01'::timestamp)`,
        ),
      )
      .groupBy(chatMessages.senderId);
    return rows;
  }

  async markRoomRead(roomId: string, userId: string) {
    await this.db
      .update(chatRoomMembers)
      .set({ lastReadAt: new Date() })
      .where(and(eq(chatRoomMembers.roomId, roomId), eq(chatRoomMembers.userId, userId)));
  }

  async markDirectRead(userId: string, otherUserId: string) {
    await this.db
      .insert(chatDirectReadStatus)
      .values({ userId, otherUserId, lastReadAt: new Date() })
      .onConflictDoUpdate({
        target: [chatDirectReadStatus.userId, chatDirectReadStatus.otherUserId],
        set: { lastReadAt: new Date() },
      });
  }
}
