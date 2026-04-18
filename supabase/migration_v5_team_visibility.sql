-- Migration v5 — Team visibility + ensure all v2 columns exist
-- Run in: Supabase → SQL Editor → Run

-- ============================================================
-- 1) Allow all authenticated users to see team profiles
--    (needed for agent dropdown in acquisitions form)
-- ============================================================
DROP POLICY IF EXISTS "Team members visible to all"   ON profiles;
DROP POLICY IF EXISTS "Owner sees all profiles"        ON profiles;
DROP POLICY IF EXISTS "Users see own profile"          ON profiles;

-- Everyone sees all profiles (names only — not sensitive)
CREATE POLICY "All auth users see profiles"
  ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users can only update their own
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- 2) Ensure all migration_v2 columns exist (idempotent)
-- ============================================================
ALTER TABLE acquisitions_leads
  ADD COLUMN IF NOT EXISTS listing_url      text,
  ADD COLUMN IF NOT EXISTS beds             integer,
  ADD COLUMN IF NOT EXISTS baths            numeric,
  ADD COLUMN IF NOT EXISTS comp1_address    text,
  ADD COLUMN IF NOT EXISTS comp1_distance   numeric,
  ADD COLUMN IF NOT EXISTS comp2_address    text,
  ADD COLUMN IF NOT EXISTS comp2_distance   numeric,
  ADD COLUMN IF NOT EXISTS comp3_address    text,
  ADD COLUMN IF NOT EXISTS comp3_distance   numeric,
  ADD COLUMN IF NOT EXISTS initial_offer    numeric,
  ADD COLUMN IF NOT EXISTS owner_name       text;

-- ============================================================
-- 3) Fix profiles role constraint to allow 'owner' and 'acquisitionist'
--    (drop and recreate if needed)
-- ============================================================
-- Note: if the check constraint already exists and is correct, this is a no-op.
-- If it's blocking inserts, uncomment the lines below:
-- ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
-- ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
--   CHECK (role IN ('owner', 'acquisitionist'));
