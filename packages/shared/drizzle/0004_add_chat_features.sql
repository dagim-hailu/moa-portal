-- Add voice_duration to chat_messages
ALTER TABLE IF EXISTS "chat_messages"
  ADD COLUMN IF NOT EXISTS "voice_duration" integer;

-- Add last_read_at to chat_room_members for group/channel read tracking
ALTER TABLE IF EXISTS "chat_room_members"
  ADD COLUMN IF NOT EXISTS "last_read_at" timestamp;

-- Create direct message read status table
CREATE TABLE IF NOT EXISTS "chat_direct_read_status" (
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "other_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "last_read_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("user_id", "other_user_id")
);

-- Add avatar_url to users
ALTER TABLE IF EXISTS "users"
  ADD COLUMN IF NOT EXISTS "avatar_url" text;

-- Add conversation_id and sender_name to notifications
ALTER TABLE IF EXISTS "notifications"
  ADD COLUMN IF NOT EXISTS "conversation_id" text;

ALTER TABLE IF EXISTS "notifications"
  ADD COLUMN IF NOT EXISTS "sender_name" text;
