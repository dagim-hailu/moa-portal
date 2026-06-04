ALTER TABLE IF EXISTS "users"
  ADD COLUMN IF NOT EXISTS "phone_number" text;

-- Optional uniqueness (uncomment if needed):
-- CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_number_unique"
--   ON "users" ("phone_number")
--   WHERE "phone_number" IS NOT NULL;

