-- ─────────────────────────────────────────────────
-- Migration 004: Phone OTP authentication
-- Run in Supabase SQL Editor: Dashboard › SQL Editor › New query
-- ─────────────────────────────────────────────────

-- Add phone columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" VARCHAR(20);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_verified_at" TIMESTAMPTZ;

-- Unique index on phone (ignores NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_key"
  ON "users" ("phone")
  WHERE "phone" IS NOT NULL;

-- Create phone_otps table
CREATE TABLE IF NOT EXISTS "phone_otps" (
  "id"         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "phone"      VARCHAR(20) NOT NULL,
  "otp_hash"   VARCHAR(128) NOT NULL,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "used_at"    TIMESTAMPTZ,
  "user_id"    UUID        REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "phone_otps_phone_created_at_idx"
  ON "phone_otps" ("phone", "created_at" DESC);
