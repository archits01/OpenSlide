-- Drop any existing RLS policies that reference user_id (idempotent)
DROP POLICY IF EXISTS "select own sessions" ON sessions;
DROP POLICY IF EXISTS "insert own sessions" ON sessions;
DROP POLICY IF EXISTS "update own sessions" ON sessions;
DROP POLICY IF EXISTS "delete own sessions" ON sessions;
DROP POLICY IF EXISTS "sessions: select own" ON sessions;
DROP POLICY IF EXISTS "sessions: insert own" ON sessions;
DROP POLICY IF EXISTS "sessions: update own" ON sessions;
DROP POLICY IF EXISTS "sessions: delete own" ON sessions;
DROP POLICY IF EXISTS "select own slides" ON slides;
DROP POLICY IF EXISTS "insert own slides" ON slides;
DROP POLICY IF EXISTS "update own slides" ON slides;
DROP POLICY IF EXISTS "delete own slides" ON slides;
DROP POLICY IF EXISTS "select own outlines" ON outlines;
DROP POLICY IF EXISTS "insert own outlines" ON outlines;
DROP POLICY IF EXISTS "update own outlines" ON outlines;
DROP POLICY IF EXISTS "delete own outlines" ON outlines;

-- CreateTable (idempotent)
CREATE TABLE IF NOT EXISTS "users" (
    "id"         UUID         NOT NULL,
    "email"      TEXT,
    "full_name"  TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Backfill existing session owners into users (idempotent)
INSERT INTO "users" ("id", "created_at", "updated_at")
SELECT DISTINCT "user_id"::UUID, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "sessions"
WHERE "user_id" IS NOT NULL
ON CONFLICT ("id") DO NOTHING;

-- Cast user_id TEXT → UUID only if it's still TEXT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions'
      AND column_name = 'user_id'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE "sessions" ALTER COLUMN "user_id" TYPE UUID USING "user_id"::UUID;
  END IF;
END $$;

-- Add FK only if it doesn't exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sessions_user_id_fkey'
  ) THEN
    ALTER TABLE "sessions"
      ADD CONSTRAINT "sessions_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
