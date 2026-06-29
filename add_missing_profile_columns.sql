-- ============================================================
-- ClimaMedix: Add Missing Profile Columns Migration
-- Run this in Supabase SQL Editor to fix schema cache errors
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS city                TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS birthdate           DATE,
  ADD COLUMN IF NOT EXISTS university_or_org   TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS specialty           TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_activist         BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS field_of_activism   TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_researcher       BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS field_of_research   TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS gender              TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS linkedin_url        TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS twitter_url         TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS facebook_url        TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS instagram_url       TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS snapchat_url        TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS tiktok_url          TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS threads_url         TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS youtube_url         TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS whatsapp_number     TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS telegram_username   TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS discord_username    TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS medium_url          TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS researchgate_url    TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS google_scholar_url  TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS orcid_id            TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS website_url         TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS github_url          TEXT    DEFAULT '';

-- Notify PostgREST to reload its schema cache immediately
NOTIFY pgrst, 'reload schema';
