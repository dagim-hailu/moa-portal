import { boolean, pgTable, text, timestamp, unique, uuid, jsonb, integer, primaryKey } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  fullName: text("full_name").notNull(),
  phoneNumber: text("phone_number"),
  passwordHash: text("password_hash").notNull(),
  role: text("role").default("user").notNull(),
  locale: text("locale").default("en").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatRooms = pgTable("chat_rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  type: text("type").notNull().default("direct"),
  avatarUrl: text("avatar_url"),
  description: text("description"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  deletedAt: timestamp("deleted_at"),
  editedAt: timestamp("edited_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatRoomMembers = pgTable("chat_room_members", {
  roomId: uuid("room_id").references(() => chatRooms.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: text("role").default("member").notNull(),
  lastReadAt: timestamp("last_read_at"),
  deletedAt: timestamp("deleted_at"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const chatDirectReadStatus = pgTable("chat_direct_read_status", {
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  otherUserId: uuid("other_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  lastReadAt: timestamp("last_read_at").defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.otherUserId] }),
}));

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id").references(() => chatRooms.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  receiverId: uuid("receiver_id").references(() => users.id, { onDelete: "cascade" }),
  content: text("content"),
  fileUrl: text("file_url"),
  fileType: text("file_type"),
  messageType: text("message_type").default("text").notNull(),
  voiceDuration: integer("voice_duration"),
  replyToId: uuid("reply_to_id"),
  deletedAt: timestamp("deleted_at"),
  editedAt: timestamp("edited_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameAm: text("name_am").notNull(),
  descriptionEn: text("description_en").default("").notNull(),
  descriptionAm: text("description_am").default("").notNull(),
  routePath: text("route_path").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  searchEnabled: boolean("search_enabled").default(false).notNull(),
  sidebarOrder: integer("sidebar_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userApplications = pgTable("user_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
}, (table) => ({
  uniq: unique("user_app_unique_idx").on(table.userId, table.applicationId),
}));

export const authSessions = pgTable("auth_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  refreshTokenHash: text("refresh_token_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  lastUsedAt: timestamp("last_used_at").defaultNow().notNull(),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dashboardLayouts = pgTable("dashboard_layouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  widgets: jsonb("widgets").$type<Array<{ id: string; x: number; y: number }>>().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  details: jsonb("details").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const portalAnnouncements = pgTable("portal_announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  titleEn: text("title_en").notNull(),
  titleAm: text("title_am").notNull(),
  bodyEn: text("body_en").notNull(),
  bodyAm: text("body_am").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // 'message', 'group_invite', 'mention', 'system'
  title: text("title").notNull(),
  body: text("body"),
  data: jsonb("data").$type<Record<string, unknown>>().default({}),
  read: boolean("read").default(false).notNull(),
  conversationId: text("conversation_id"),
  senderName: text("sender_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  messages: boolean("messages").default(true).notNull(),
  groups: boolean("groups").default(true).notNull(),
  channels: boolean("channels").default(true).notNull(),
  mentions: boolean("mentions").default(true).notNull(),
  sound: boolean("sound").default(true).notNull(),
  desktop: boolean("desktop").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chatPinnedConversations = pgTable("chat_pinned_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  conversationId: text("conversation_id").notNull(), // room UUID or user UUID
  pinnedAt: timestamp("pinned_at").defaultNow().notNull(),
}, (table) => ({
  uniq: unique("chat_pinned_user_conv_idx").on(table.userId, table.conversationId),
}));

export const chatBlockedEntities = pgTable("chat_blocked_entities", {
  id: uuid("id").primaryKey().defaultRandom(),
  blockerId: uuid("blocker_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  blockedId: text("blocked_id").notNull(), // room UUID or user UUID
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniq: unique("chat_blocked_user_entity_idx").on(table.blockerId, table.blockedId),
}));
