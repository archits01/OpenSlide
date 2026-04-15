-- Profile hardening migration
-- Goal: make public.users the single source of truth for profile data.
-- Idempotent — safe to run on a DB where handle_new_user and RLS may or may not exist.

-- ─── 1. Add avatar_path column ────────────────────────────────────────────────
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_path" TEXT;

-- ─── 2. Auto-update updated_at on any UPDATE ─────────────────────────────────
CREATE OR REPLACE FUNCTION set_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_set_updated_at ON "users";
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON "users"
FOR EACH ROW
EXECUTE FUNCTION set_users_updated_at();

-- ─── 3. Enable RLS and drop any permissive policies ──────────────────────────
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

-- Drop any legacy policies — server (Prisma superuser) bypasses RLS,
-- so the anon/authenticated roles get no access. All profile reads/writes
-- go through the /api/profile route.
DROP POLICY IF EXISTS "users: select own" ON "users";
DROP POLICY IF EXISTS "users: insert own" ON "users";
DROP POLICY IF EXISTS "users: update own" ON "users";
DROP POLICY IF EXISTS "users: delete own" ON "users";
DROP POLICY IF EXISTS "Allow users to read own row" ON "users";
DROP POLICY IF EXISTS "Allow users to update own row" ON "users";
DROP POLICY IF EXISTS "select own user" ON "users";
DROP POLICY IF EXISTS "update own user" ON "users";

-- ─── 4. One-time backfill from auth.users.raw_user_meta_data ─────────────────
-- For existing users whose public.users row was created before this trigger
-- copied profile fields. Only fills NULLs — never overwrites.
UPDATE public.users u
SET
  full_name  = COALESCE(u.full_name,  au.raw_user_meta_data->>'full_name'),
  avatar_url = COALESCE(u.avatar_url, au.raw_user_meta_data->>'avatar_url'),
  email      = COALESCE(u.email,      au.email)
FROM auth.users au
WHERE u.id = au.id;

-- ─── 5. Storage bucket RLS for 'avatars' ─────────────────────────────────────
-- Users can upload/update/delete blobs only under their own folder ({user.id}/...).
-- Anyone can read (so <img src="..."> works without auth headers).
-- Note: assumes the 'avatars' bucket already exists in Supabase dashboard.

DROP POLICY IF EXISTS "avatars: public read" ON storage.objects;
DROP POLICY IF EXISTS "avatars: users upload own" ON storage.objects;
DROP POLICY IF EXISTS "avatars: users update own" ON storage.objects;
DROP POLICY IF EXISTS "avatars: users delete own" ON storage.objects;

CREATE POLICY "avatars: public read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars: users upload own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars: users update own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars: users delete own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
