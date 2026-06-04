CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL UNIQUE,
  "username" text NOT NULL UNIQUE,
  "full_name" text NOT NULL,
  "phone_number" text,
  "password_hash" text NOT NULL,
  "role" text DEFAULT 'user' NOT NULL,
  "locale" text DEFAULT 'en' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "applications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "name_en" text NOT NULL,
  "name_am" text NOT NULL,
  "description_en" text DEFAULT '' NOT NULL,
  "description_am" text DEFAULT '' NOT NULL,
  "route_path" text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "search_enabled" boolean DEFAULT false NOT NULL,
  "sidebar_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user_applications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "application_id" uuid NOT NULL REFERENCES "applications"("id") ON DELETE cascade,
  "assigned_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "user_app_unique_idx" UNIQUE("user_id","application_id")
);

CREATE TABLE IF NOT EXISTS "auth_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "refresh_token_hash" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "last_used_at" timestamp DEFAULT now() NOT NULL,
  "revoked_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "dashboard_layouts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE cascade,
  "widgets" jsonb NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "actor_user_id" uuid REFERENCES "users"("id"),
  "action" text NOT NULL,
  "target_type" text NOT NULL,
  "target_id" text NOT NULL,
  "details" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "contact_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "full_name" text NOT NULL,
  "email" text NOT NULL,
  "message" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "portal_announcements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title_en" text NOT NULL,
  "title_am" text NOT NULL,
  "body_en" text NOT NULL,
  "body_am" text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
