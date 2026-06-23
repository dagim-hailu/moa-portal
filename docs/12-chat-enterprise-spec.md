# MOA Connect — Enterprise Chat Enhancement Specification

**Document ID:** CHAT-SPEC-001  
**Version:** 1.0  
**Status:** Draft for Engineering  
**Audience:** Backend, Frontend, Platform, Compliance  
**Scope:** Enhance existing MOA Portal chat (`/chat`) for 500+ concurrent users with audit compliance, organizational structure, and Telegram-class UX without theme changes.

---

## 1. Executive Summary

MOA Connect is an in-portal messaging module serving Ministry staff. The current implementation provides direct messages, groups, channels, file/voice attachments, soft-delete, pinning (schema only), blocking, and partial read-tracking. It runs on PostgreSQL (Drizzle ORM), NestJS (GraphQL + legacy REST proxy), Next.js (single-page chat UI), and Socket.io for real-time delivery.

This specification defines the **gap closure** required to meet enterprise messaging requirements: reverse-chronological history at scale, department-aware auto-groups, channel permission hierarchy, immutable audit trails, profile propagation, notification lifecycle, and consistent real-time synchronization across 500+ clients.

---

## 2. Current State Assessment

### 2.1 Implemented (Baseline)

| Area | Current Capability | Location |
|------|-------------------|----------|
| Direct / group / channel rooms | `chat_rooms.type` ∈ {direct, group, channel} | `packages/shared/src/db/index.ts` |
| Messages | Text, attachment, voice; soft-delete via `deletedAt` | `chat_messages` |
| Member roles | `admin`, `member`; channel posting restricted to admin/manager in GraphQL resolver | `chat.resolver.ts` |
| Read tracking (partial) | `chat_room_members.last_read_at`, `chat_direct_read_status` | Migration `0004` |
| Pinning (partial) | `chat_pinned_conversations` table; frontend state | Schema + `page.tsx` |
| Blocking | `chat_blocked_entities` | Schema + resolver |
| Profile (partial) | `users.avatarUrl`; `updateProfile` mutation | GraphQL resolver |
| Notifications (partial) | `notifications` table; unread count endpoint | REST proxy |
| Real-time (dual stack) | Socket.io events + GraphQL subscriptions (PubSub, in-memory) | Frontend + resolver |

### 2.2 Critical Gaps

| Requirement | Gap |
|-------------|-----|
| Reverse chronological pagination | GraphQL returns latest 100 only; no cursor pagination; frontend renders ascending |
| Video integration | `fileType: "video"` in UI types; no dedicated player, streaming, or transcode metadata |
| Real-time consistency | Dual transport (Socket.io + GraphQL PubSub); in-memory PubSub not cluster-safe |
| Member roster + role changes RT | No WebSocket events for `memberAdded`, `memberRemoved`, `roleChanged` |
| Profile propagation RT | Profile updates do not broadcast to connected clients |
| User removal audit | System message on remove exists in resolver; no immutable audit row; not visible in dedicated audit view |
| Channel hierarchy | `manager` role referenced but not assignable via API; creator vs admin distinction missing |
| Deleted message audit | Trash shows sender-deleted only; missing actor, context, restore/purge permissions |
| Pinning UX | DB table exists; sidebar sort not enforced server-side; no pin limit |
| Notifications | No auto-dismiss on read; no deep-link to message; history not audit-preserved separately |
| Text input | Enter sends; Ctrl+Enter soft break not implemented; no auto-wrap styling contract |
| Departments | Not modeled; no M2M user↔department |
| Auto department groups | Not implemented |
| Scale (500+) | No connection pooling strategy for WS; no Redis adapter; indexes incomplete for hot queries |

---

## 3. Target Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js Chat Shell (/chat)                   │
│  Sidebar │ ConversationView │ MemberPanel │ NotificationCenter │
│  Zustand/Context store + optimistic UI + subscription handlers   │
└───────────────┬───────────────────────────────┬─────────────────┘
                │ GraphQL (HTTP)                 │ WebSocket (single)
                ▼                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NestJS Chat Service Layer                     │
│  Resolvers │ Guards (JWT + room membership) │ EventPublisher     │
└───────────────┬───────────────────────────────┬─────────────────┘
                │                                │
        ┌───────▼───────┐                ┌───────▼───────┐
        │  PostgreSQL   │                │  Redis PubSub  │
        │  (source of   │                │  (WS fan-out,  │
        │   truth)      │                │   presence)    │
        └───────────────┘                └───────────────┘
                │
        ┌───────▼───────┐
        │  Object Store │  (avatars, attachments, video)
        └───────────────┘
```

**Architectural decision:** Consolidate real-time delivery on **one transport** (GraphQL subscriptions over WebSocket, or Socket.io with Redis adapter). Retire duplicate paths. All mutations emit domain events through Redis for horizontal scaling.

---

## 4. Database Schema

### 4.1 Entity Relationship Overview

```
users ──┬── user_departments ── departments
        ├── chat_room_members ── chat_rooms
        ├── chat_pinned_conversations
        ├── chat_blocked_entities
        ├── chat_direct_read_status
        └── chat_audit_events (actor)

departments ── chat_rooms (system department group, 1:1)

chat_rooms ── chat_messages ── chat_message_deletions (immutable audit)
            └── chat_room_members

notifications ── notification_audit_log (immutable)
```

### 4.2 New / Extended Tables

#### `departments`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| slug | TEXT | UNIQUE, NOT NULL |
| name_en | TEXT | NOT NULL |
| name_am | TEXT | NOT NULL |
| parent_id | UUID | FK → departments.id, NULL |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMPTZ | NOT NULL |

**Indexes:** `idx_departments_slug`, `idx_departments_parent_id`

#### `user_departments` (M2M)
| Column | Type | Constraints |
|--------|------|-------------|
| user_id | UUID | FK → users.id, CASCADE |
| department_id | UUID | FK → departments.id, CASCADE |
| assigned_at | TIMESTAMPTZ | NOT NULL |
| assigned_by | UUID | FK → users.id, NULL |

**PK:** `(user_id, department_id)`  
**Indexes:** `idx_user_departments_department_id`

#### `users` (extensions)
| Column | Type | Notes |
|--------|------|-------|
| bio | TEXT | Max 500 chars |
| avatar_url | TEXT | Already partial |
| phone_number | TEXT | Already exists |
| profile_updated_at | TIMESTAMPTZ | For cache invalidation |

#### `chat_rooms` (extensions)
| Column | Type | Notes |
|--------|------|-------|
| department_id | UUID | FK → departments.id, NULL; set for system groups |
| is_system | BOOLEAN | DEFAULT false; true = non-deletable |
| system_type | TEXT | NULL \| `department` |
| creator_id | UUID | FK → users.id; immutable channel creator |

**Index:** `idx_chat_rooms_department_system` ON `(department_id)` WHERE `is_system = true`

#### `chat_room_members` (extensions)
| Column | Type | Notes |
|--------|------|-------|
| role | TEXT | ENUM: `admin`, `manager`, `member` |
| last_read_at | TIMESTAMPTZ | Exists |
| removed_at | TIMESTAMPTZ | Soft membership removal |
| removed_by | UUID | FK → users.id |

**Unique:** `(room_id, user_id)` WHERE `removed_at IS NULL`  
**Indexes:** `idx_crm_room_user_active`, `idx_crm_user_id`

#### `chat_messages` (extensions)
| Column | Type | Notes |
|--------|------|-------|
| message_type | TEXT | Add `system`, `video` |
| thread_root_id | UUID | FK → chat_messages.id, NULL |
| video_duration | INTEGER | Seconds |
| video_thumbnail_url | TEXT | NULL |
| metadata | JSONB | Transcode status, dimensions |

**Indexes (critical for 500+ users):**
```sql
-- Room history (newest first, paginated)
CREATE INDEX idx_chat_messages_room_created_desc
  ON chat_messages (room_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- DM history both directions
CREATE INDEX idx_chat_messages_dm_created_desc
  ON chat_messages (sender_id, receiver_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Unread computation
CREATE INDEX idx_chat_messages_room_unread
  ON chat_messages (room_id, created_at)
  WHERE deleted_at IS NULL;
```

#### `chat_message_deletions` (immutable audit)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| message_id | UUID | FK → chat_messages.id |
| conversation_type | TEXT | `direct`, `group`, `channel` |
| conversation_id | TEXT | room UUID or sorted DM pair key |
| deleted_by | UUID | FK → users.id |
| deleted_at | TIMESTAMPTZ | NOT NULL |
| original_content | TEXT | Snapshot |
| original_file_url | TEXT | NULL |
| purge_at | TIMESTAMPTZ | NULL = soft; set = hard purge scheduled |
| restored_at | TIMESTAMPTZ | NULL |
| restored_by | UUID | NULL |

**Constraint:** No UPDATE except `restored_at`, `restored_by`, `purge_at` (append-only semantics).

#### `chat_audit_events` (room-level actions)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| room_id | UUID | FK, NULL for DM |
| event_type | TEXT | See §7 |
| actor_id | UUID | FK → users.id |
| target_user_id | UUID | NULL |
| payload | JSONB | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL |

**Index:** `idx_chat_audit_room_created` ON `(room_id, created_at DESC)`

#### `chat_pinned_conversations` (existing, enforce)
| Column | Type | Notes |
|--------|------|-------|
| sort_order | INTEGER | User-defined pin order |

**Constraint:** Max 50 pins per user (enforced in service layer).

#### `notification_audit_log` (immutable notification history)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| notification_id | UUID | FK → notifications.id |
| user_id | UUID | FK |
| action | TEXT | `created`, `read`, `dismissed`, `navigated` |
| created_at | TIMESTAMPTZ | NOT NULL |

### 4.3 Department Auto-Group Logic (Data Layer)

**Trigger / worker rule:** On `user_departments` INSERT/DELETE:
1. Resolve department `D`.
2. Find or create `chat_rooms` WHERE `department_id = D.id AND is_system = true AND system_type = 'department'`.
3. Name: `Department: {department.name_en}`.
4. INSERT/soft-remove `chat_room_members` with `role = 'member'`.
5. Emit `room.memberChanged` event.
6. Reject DELETE on system rooms (`is_system = true`) at API layer with `403 SYSTEM_ROOM_PROTECTED`.

---

## 5. API Specification

Authentication: JWT (HTTP-only cookie + Bearer header). All endpoints require valid session.

Authorization: Room-scoped operations verify membership via `chat_room_members` (active rows only). Platform roles (`admin`, `supervisor`, `user`) do not override room roles unless explicitly defined in access matrix (§8).

### 5.1 GraphQL Queries

| Operation | Arguments | Response | Auth Rule |
|-----------|-----------|----------|-----------|
| `getUserRooms` | — | `[ChatRoom!]!` | Authenticated |
| `getRoomMembers` | `roomId: ID!` | `[ChatRoomMember!]!` | Room member |
| `getChatHistory` | `roomId`, `otherUserId`, `cursor`, `limit` | `MessageConnection!` | Participant |
| `getDeletedMessagesAudit` | `scope`, `cursor`, `limit` | `DeletedMessageConnection!` | Sender OR room admin |
| `getPinnedConversations` | — | `[PinnedConversation!]!` | Authenticated |
| `getUnreadCounts` | — | `[UnreadCount!]!` | Authenticated |
| `searchUsers` | `q: String!` | `[ChatUser!]!` | Authenticated |
| `getDepartments` | — | `[Department!]!` | Authenticated |
| `getUserProfile` | `userId: ID!` | `ChatUserProfile!` | Authenticated |
| `getNotifications` | `unreadOnly: Boolean` | `[Notification!]!` | Authenticated |

#### `MessageConnection` (cursor pagination)
```graphql
type MessageConnection {
  edges: [MessageEdge!]!
  pageInfo: PageInfo!
}
type MessageEdge {
  cursor: String!      # opaque: base64(createdAt:id)
  node: ChatMessage!
}
type PageInfo {
  hasPreviousPage: Boolean!   # older messages exist
  endCursor: String
}
```
**Ordering:** `created_at DESC` (newest first). UI renders list inverted or uses `flex-col-reverse` for chat-bottom anchor.

### 5.2 GraphQL Mutations

| Operation | Arguments | Side Effects | Auth Rule |
|-----------|-----------|--------------|-----------|
| `sendMessage` | `roomId/receiverId`, `content`, `fileUrl`, `messageType`, `replyToId`, `clientMessageId` | Insert message; emit `messageAdded`; create notification | Member; channel role check |
| `editMessage` | `messageId`, `content` | Update; audit optional | Sender only |
| `deleteMessage` | `messageId` | Soft-delete + insert `chat_message_deletions` | Sender OR room admin |
| `restoreMessage` | `deletionId` | Restore from audit | Room admin |
| `purgeMessage` | `deletionId` | Hard delete blob + row | Platform admin OR room admin |
| `createRoom` | `name`, `type`, `memberIds` | Insert room + members | Authenticated |
| `updateRoom` | `roomId`, fields | Update metadata | Room admin |
| `deleteRoom` | `roomId` | Soft-delete unless `is_system` | Room admin |
| `addRoomMember` | `roomId`, `userId`, `role?` | Insert member; system message; audit | Room admin |
| `removeRoomMember` | `roomId`, `userId` | Soft-remove; system message; notify removed user | Room admin |
| `promoteMember` | `roomId`, `userId`, `role` | Update role; audit | Room admin (cannot demote creator) |
| `updateProfile` | `fullName`, `bio`, `avatarUrl`, ... | Update user; emit `profileUpdated` | Self |
| `pinConversation` | `targetId`, `targetType` | Upsert pin | Self |
| `unpinConversation` | `targetId` | Delete pin | Self |
| `markConversationRead` | `conversationId`, `conversationType` | Update read cursor | Participant |
| `markNotificationRead` | `notificationId` | Set read; append audit | Self |
| `assignUserDepartments` | `userId`, `departmentIds` | M2M sync; trigger auto-group | Platform admin |

### 5.3 REST Endpoints (retained for uploads / proxy)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/api/chat/upload` | Multipart upload (image, file, voice, video) | JWT |
| GET | `/api/chat/uploads/:key` | Signed URL redirect / stream | JWT + message access |

**Upload response:**
```json
{
  "fileUrl": "/uploads/uuid.webm",
  "fileType": "voice|image|file|video",
  "mimeType": "audio/webm",
  "size": 102400,
  "originalName": "voice.webm",
  "videoDuration": null,
  "videoThumbnailUrl": null
}
```

**Error envelope (all APIs):**
```json
{
  "error": {
    "code": "FORBIDDEN_NOT_ROOM_ADMIN",
    "message": "Only room admins can remove members.",
    "details": {}
  }
}
```

Standard codes: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `SYSTEM_ROOM_PROTECTED`, `CHANNEL_READ_ONLY`, `BLOCKED`, `RATE_LIMITED`.

---

## 6. Real-Time Event Strategy

### 6.1 Transport

- **Primary:** GraphQL subscriptions over WebSocket (same JWT handshake as HTTP).
- **Fallback:** Socket.io with Redis adapter (`@socket.io/redis-adapter`) if subscription migration is phased.
- **Rule:** One event bus (Redis Pub/Sub). NestJS publishes after DB commit.

### 6.2 Event Catalog

| Event | Payload | Recipients | Consistency |
|-------|---------|------------|-------------|
| `message.added` | Full message + `clientMessageId` | Room members / DM pair | At-least-once; client dedupes by `id` |
| `message.edited` | `messageId`, `content`, `editedAt` | Same | |
| `message.deleted` | `messageId`, `deletionId` | Same | |
| `message.restored` | `messageId` | Room admins + members | |
| `room.created` | Room + initial members | Each new member | |
| `room.updated` | Room metadata | All members | |
| `room.deleted` | `roomId` | All members | |
| `room.memberAdded` | Member + user profile | All members | |
| `room.memberRemoved` | `userId`, `removedBy` | All members + removed user | |
| `room.memberRoleChanged` | `userId`, `oldRole`, `newRole` | All members | |
| `user.profileUpdated` | `userId`, changed fields | All clients with user in roster | |
| `user.presenceChanged` | `userId`, `online` | Subscribers of shared conversations | |
| `notification.created` | Notification object | Target user | |
| `notification.dismissed` | `notificationId` | Target user | |
| `conversation.readUpdated` | `conversationId`, `lastReadAt` | Self (multi-device sync) | |
| `pin.updated` | Pinned list snapshot | Self | |

### 6.3 Consistency Guarantees

1. **Write path:** Mutation succeeds → DB transaction commits → Redis publish. Clients never see events for failed writes.
2. **Ordering:** Per-room total order by `created_at` (server clock). Client sorts by `createdAt` + `id` tie-break.
3. **Idempotency:** `clientMessageId` (UUID) on send; server stores in `metadata` and echoes in ack to replace optimistic row.
4. **Reconnect:** On WS reconnect, client calls `getChatHistory` with `cursor = lastKnownMessageId` and `getUnreadCounts`.
5. **Multi-instance:** Redis Pub/Sub mandatory before production scale >1 NestJS replica.

### 6.4 Presence

- Redis key: `presence:user:{id}` TTL 60s, refreshed on heartbeat.
- On disconnect, emit `user.presenceChanged` after TTL expiry.
- Heartbeat interval: 30s.

---

## 7. Frontend Component Architecture

### 7.1 Module Structure

```
apps/shell/src/app/chat/
├── page.tsx                    # Route shell, layout only
├── components/
│   ├── ChatLayout.tsx          # Sidebar + main split
│   ├── ConversationSidebar/
│   │   ├── SidebarTabs.tsx
│   │   ├── ConversationList.tsx
│   │   ├── PinnedSection.tsx   # Pinned items first
│   │   └── SearchBar.tsx
│   ├── ConversationView/
│   │   ├── MessageList.tsx     # Virtualized; newest-first data, bottom anchor
│   │   ├── MessageBubble.tsx
│   │   ├── SystemMessage.tsx   # Removals, joins
│   │   ├── VideoPlayer.tsx     # Inline HLS/MP4
│   │   ├── VoicePlayer.tsx
│   │   ├── ImageLightbox.tsx
│   │   └── Composer.tsx        # Ctrl+Enter, Enter send
│   ├── MemberPanel/
│   │   ├── MemberList.tsx
│   │   ├── RoleBadge.tsx
│   │   └── AddMemberModal.tsx
│   ├── TrashView/
│   │   └── DeletedMessageAudit.tsx
│   ├── NotificationCenter/
│   │   └── NotificationItem.tsx  # Deep-link on click
│   └── ProfileModal/
│       └── ProfileEditor.tsx
├── hooks/
│   ├── useChatSocket.ts        # Single WS connection
│   ├── useConversations.ts
│   ├── useMessages.ts          # Cursor pagination
│   ├── useUnreadCounts.ts
│   └── usePinnedConversations.ts
└── store/
    └── chatStore.ts            # Zustand: normalized entities
```

### 7.2 State Management

**Normalized store shape:**
```typescript
{
  users: Record<ID, User>,
  rooms: Record<ID, Room>,
  messages: Record<ID, Message>,          // by message id
  messagesByConversation: Record<ID, ID[]>, // ordered newest-first
  memberships: Record<roomId, Member[]>,
  pinned: PinnedItem[],
  unread: Record<conversationId, number>,
  activeConversationId: ID | null,
  connectionStatus: 'connected' | 'reconnecting' | 'offline',
}
```

**Optimistic send flow:**
1. Composer generates `clientMessageId`.
2. Insert optimistic message at head of conversation list.
3. Mutation/WS emit.
4. On `message.added` with matching `clientMessageId`, replace optimistic row.
5. On error, mark message `failed` with retry action.

### 7.3 Feature-Specific UI Contracts

| Feature | UI Behavior |
|---------|-------------|
| Message order | Fetch newest-first; infinite scroll upward loads older (`fetchPreviousPage`) |
| Video | `<video controls playsInline>`; max height 360px; tap fullscreen; poster from `videoThumbnailUrl` |
| Member list | Live updates on `room.member*` events without refresh |
| Profile edit | Save → immediate local update; other clients receive `user.profileUpdated` |
| Removal | System bubble: "{name} was removed by {admin}"; removed user gets notification + DM optional |
| Channel read-only | Composer disabled for `member`; tooltip explains role |
| Trash | Tab shows deleted messages with source, actor, timestamp; admin restore/purge buttons |
| Pins | Pin icon on conversation; pinned section above list; drag reorder (optional phase) |
| Notifications | Bell shows unread only; click navigates to conversation + scrolls to message; mark read removes from list |
| Composer | `Enter` → send; `Ctrl+Enter` → insert `\n`; textarea `white-space: pre-wrap; word-break: break-word` |
| Departments | Profile shows department chips; member list shows department column |

---

## 8. Access Control Matrix

Platform roles: `admin`, `supervisor`, `user` (portal-wide).  
Room roles: `admin`, `manager`, `member`.

| Action | Room Admin | Room Manager | Room Member | Channel Member | Platform Admin |
|--------|:----------:|:------------:|:-----------:|:--------------:|:--------------:|
| View room / history | ✓ | ✓ | ✓ | ✓ (read) | ✓ |
| Send message (group) | ✓ | ✓ | ✓ | — | — |
| Send message (channel) | ✓ | ✓ | — | — | — |
| Edit own message | ✓ | ✓ | ✓ | — | — |
| Delete own message | ✓ | ✓ | ✓ | — | — |
| Delete any message | ✓ | — | — | — | ✓ |
| Add/remove members | ✓ | — | — | — | — |
| Promote to manager | ✓ | — | — | — | — |
| Promote to admin | ✓* | — | — | — | — |
| Edit room metadata | ✓ | — | — | — | — |
| Delete room | ✓** | — | — | — | — |
| Restore deleted message | ✓ | — | — | — | ✓ |
| Purge deleted message | — | — | — | — | ✓ |
| Pin conversation (self) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Block user (self) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Assign departments | — | — | — | — | ✓ |
| Delete system dept group | — | — | — | — | — (never) |

\*Room creator retains admin; cannot be demoted by other admins.  
\*\*System department groups (`is_system = true`) cannot be deleted.

**Channel default:** New members join as `member` (read-only). Creator is `admin`. Explicit promotion required for `manager`.

---

## 9. Audit & Compliance

All rows in `chat_message_deletions` and `chat_audit_events` are **append-only**. Application DB user for runtime has no DELETE grant on these tables.

### 9.1 Audited Actions

| Action | Storage | Visible To |
|--------|---------|------------|
| Message soft-delete | `chat_message_deletions` | Sender, room admins, platform admin |
| Message restore/purge | Update deletion row timestamps | Same |
| Member removed | `chat_audit_events` + system message | All room members |
| Role changed | `chat_audit_events` | All room members |
| Room deleted | `chat_audit_events` | Former members |
| Department assignment | Portal `audit_logs` | Compliance officers |

### 9.2 Retention

- Soft-deleted messages: 90 days in trash, then eligible for purge job.
- Audit events: 7 years (configurable).
- Notification audit log: 1 year.

---

## 10. Scalability (500+ Concurrent Users)

| Concern | Mitigation |
|---------|------------|
| WS connections | Horizontal NestJS replicas + Redis adapter; target 2k connections (4× headroom) |
| Message history | Cursor pagination; max 50 per fetch; virtualized list |
| Unread counts | Materialized via `last_read_at` comparison; cached in Redis 30s TTL |
| Hot room writes | Serialize per `room_id` in worker if needed; PostgreSQL handles 500 users |
| File/video storage | Object storage (MinIO); CDN/signed URLs; async thumbnail generation |
| Subscriptions | Filter server-side by `roomId` / `userId`; never broadcast globally |
| DB connections | PgBouncer transaction pooling; pool size 20 per instance |

---

## 11. Implementation Priority Sequence

### Phase 1 — Foundation & Data Integrity (Blocking)

1. Consolidate real-time transport (retire dual Socket.io + GraphQL duplicate paths).
2. Add Redis Pub/Sub for event fan-out.
3. Implement cursor-based `MessageConnection` (newest-first).
4. Server-side unread counts + `markConversationRead`.
5. Database indexes from §4.2.

**Exit criteria:** Two users exchange messages in real time; unread badges survive refresh; no duplicate messages.

### Phase 2 — Governance & Permissions

1. Full room role model (`admin`, `manager`, `member`) with promote/demote APIs.
2. Channel read-only enforcement (UI + API).
3. `chat_message_deletions` immutable audit + Trash UI with restore.
4. Member removal system messages + `chat_audit_events`.
5. Creator immutability on channels.

**Exit criteria:** Admin removes member; all members see system message; deleted messages appear in Trash with actor.

### Phase 3 — User Experience Parity

1. Pinning: server-ordered sidebar, pin/unpin mutations wired.
2. Notification deep-links + auto-dismiss on read + audit log.
3. Profile editor with avatar upload + `profileUpdated` broadcast.
4. Composer: Ctrl+Enter soft break, word wrap.
5. Voice player progress fix; persist `voiceDuration`.

**Exit criteria:** Pin persists across sessions; notification click opens exact conversation; profile change visible to other user without refresh.

### Phase 4 — Organizational Structure

1. `departments` + `user_departments` tables and admin assignment API.
2. Department auto-group worker (create/sync/system-protect).
3. Department display in profiles and member lists.
4. Search by department.

**Exit criteria:** Assign user to department → auto-joined to `Department: {Name}` group; group cannot be deleted.

### Phase 5 — Rich Media & Scale Hardening

1. Inline video player component + upload pipeline metadata.
2. Async video thumbnail generation (background job).
3. Optional live stream integration (HLS ingest endpoint — separate spec if required).
4. Load test 500 concurrent WS connections.
5. Split monolithic `page.tsx` into component architecture (§7.1).

**Exit criteria:** Video attachment plays inline; p95 message delivery <500ms under 500 simulated clients.

---

## 12. Migration Notes (Existing Deployment)

1. Apply SQL migrations: departments, audit tables, indexes, `chat_rooms` extensions.
2. Backfill `chat_rooms.creator_id` from `created_by`.
3. Set `is_system = false` for all existing rooms.
4. Migrate frontend from monolithic `page.tsx` incrementally (Phase 5) without downtime.
5. Run department sync job once after department seed.

---

## 13. Open Decisions (Requires Product Input)

| Item | Options | Recommendation |
|------|---------|----------------|
| Live video streaming | WebRTC SFU vs HLS ingest | HLS for v1 (simpler, one-way broadcast) |
| Message retention default | 1yr / 7yr / indefinite | 7yr for government compliance |
| DM deletion visibility | Sender-only vs both parties | Both see placeholder "Message deleted" |
| Max attachment size | 10MB / 100MB / 500MB | 100MB general; 500MB video admin-only |

---

## 14. Appendix: Current → Target File Mapping

| Current Asset | Target State |
|---------------|--------------|
| `apps/shell/src/app/chat/page.tsx` (~1800 lines) | Decomposed into §7.1 components |
| `apps/server/src/modules/chat.resolver.ts` | Extended mutations/queries; Redis publisher |
| `packages/shared/src/db/index.ts` | New tables per §4 |
| `apps/shell/src/app/api/chat/[[...path]]/route.ts` | Retained for uploads only |
| Socket.io gateway (if present) | Deprecated after Phase 1 |

---

*End of specification.*
