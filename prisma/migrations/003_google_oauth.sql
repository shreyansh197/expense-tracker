-- ─────────────────────────────────────────────────
-- Migration 003: Google OAuth support
-- Run in Supabase SQL Editor: Dashboard › SQL Editor › New query
-- ─────────────────────────────────────────────────

-- Add google_id column to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "google_id" VARCHAR(255);

-- Create unique partial index (ignores NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS "users_google_id_key"
  ON "users" ("google_id")
  WHERE "google_id" IS NOT NULL;
