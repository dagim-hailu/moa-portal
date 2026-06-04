ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' NOT NULL;

UPDATE users
SET
  username = COALESCE(username, split_part(email, '@', 1)),
  role = CASE
    WHEN lower(email) = 'admin@moa.gov.et' THEN 'admin'
    WHEN lower(email) = 'supervisor@moa.gov.et' THEN 'supervisor'
    ELSE 'user'
  END
WHERE username IS NULL OR role IS NULL;

ALTER TABLE users
  ALTER COLUMN username SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'users_username_unique'
  ) THEN
    CREATE UNIQUE INDEX users_username_unique ON users (username);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE cascade,
  refresh_token_hash text NOT NULL,
  expires_at timestamp NOT NULL,
  last_used_at timestamp DEFAULT now() NOT NULL,
  revoked_at timestamp,
  created_at timestamp DEFAULT now() NOT NULL
);
