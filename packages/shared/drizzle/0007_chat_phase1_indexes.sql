-- Phase 1: performance indexes for chat message queries at scale

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created_desc
  ON chat_messages (room_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver_created
  ON chat_messages (receiver_id, created_at DESC)
  WHERE deleted_at IS NULL AND room_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_receiver_created
  ON chat_messages (sender_id, receiver_id, created_at DESC)
  WHERE deleted_at IS NULL AND room_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_chat_room_members_user_id
  ON chat_room_members (user_id)
  WHERE deleted_at IS NULL;
