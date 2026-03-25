-- ─────────────────────────────────────────────────
-- Migration 004: Phone auth columns
-- Run in Supabase SQL Editor: Dashboard › SQL Editor › New query
-- NOTE: OTP storage is handled by Supabase Auth internally.
--       You do NOT need a phone_otps table.
-- ─────────────────────────────────────────────────

-- Add phone columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" VARCHAR(20);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_verified_at" TIMESTAMPTZ;

-- Unique index on phone (ignores NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_key"
  ON "users" ("phone")
  WHERE "phone" IS NOT NULL;
