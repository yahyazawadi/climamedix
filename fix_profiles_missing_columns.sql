-- ============================================================
-- ClimaMedix: TARGETED fix for confirmed missing profile columns
-- Run this in Supabase SQL Editor (project: wzytekdfbjlbtvsbxuyi)
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS title             TEXT DEFAULT 'Mr' CHECK (title IN ('Dr', 'Prof', 'Mr', 'Ms')),
  ADD COLUMN IF NOT EXISTS university_or_org TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS specialty         TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_activist       BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS field_of_activism TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS instagram_url     TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS snapchat_url      TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS tiktok_url        TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS threads_url       TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS youtube_url       TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS whatsapp_number   TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS telegram_username TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS discord_username  TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS medium_url        TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS researchgate_url  TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS google_scholar_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS orcid_id          TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS website_url       TEXT DEFAULT '';

-- Verify the fix worked - you should see all columns listed
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY column_name;
