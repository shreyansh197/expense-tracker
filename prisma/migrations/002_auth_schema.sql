-- ═══════════════════════════════════════════════════════════════
-- Expense Tracker — Full Schema Migration (v2 — clean slate)
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- Drops old 001 tables + creates all new auth/domain tables
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ────────────────────────── DROP OLD SCHEMA (from 001) ──────────────────
-- Drop in reverse dependency order
DROP TABLE IF EXISTS "sync_cursors" CASCADE;
DROP TABLE IF EXISTS "business_payments" CASCADE;
DROP TABLE IF EXISTS "business_ledgers" CASCADE;
DROP TABLE IF EXISTS "workspace_settings" CASCADE;
DROP TABLE IF EXISTS "expenses" CASCADE;
DROP TABLE IF EXISTS "audit_logs" CASCADE;
DROP TABLE IF EXISTS "device_links" CASCADE;
DROP TABLE IF EXISTS "invites" CASCADE;
DROP TABLE IF EXISTS "sessions" CASCADE;
DROP TABLE IF EXISTS "devices" CASCADE;
DROP TABLE IF EXISTS "memberships" CASCADE;
DROP TABLE IF EXISTS "passkeys" CASCADE;
DROP TABLE IF EXISTS "workspaces" CASCADE;
-- Old 001 tables
DROP TABLE IF EXISTS "transaction_tags" CASCADE;
DROP TABLE IF EXISTS "transactions" CASCADE;
DROP TABLE IF EXISTS "subscriptions" CASCADE;
DROP TABLE IF EXISTS "recurring_schedules" CASCADE;
DROP TABLE IF EXISTS "statements" CASCADE;
DROP TABLE IF EXISTS "goals" CASCADE;
DROP TABLE IF EXISTS "rules" CASCADE;
DROP TABLE IF EXISTS "merchants" CASCADE;
DROP TABLE IF EXISTS "tags" CASCADE;
DROP TABLE IF EXISTS "categories" CASCADE;
DROP TABLE IF EXISTS "accounts" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
-- Old enums
DROP TYPE IF EXISTS "account_type" CASCADE;
DROP TYPE IF EXISTS "category_type" CASCADE;
DROP TYPE IF EXISTS "transaction_type" CASCADE;
DROP TYPE IF EXISTS "recurring_frequency" CASCADE;
DROP TYPE IF EXISTS "alert_type" CASCADE;
DROP TYPE IF EXISTS "budget_period" CASCADE;
DROP TYPE IF EXISTS "MemberRole" CASCADE;

-- ────────────────────────── ENUMS ──────────────────────────
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- ────────────────────────── USERS ──────────────────────────
CREATE TABLE "users" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email"             VARCHAR(255) NOT NULL UNIQUE,
  "email_verified_at" TIMESTAMPTZ,
  "password_hash"     VARCHAR(255),
  "totp_secret"       VARCHAR(64),
  "totp_enabled_at"   TIMESTAMPTZ,
  "recovery_codes"    VARCHAR(20)[] NOT NULL DEFAULT '{}',
  "name"              VARCHAR(120) NOT NULL DEFAULT '',
  "avatar_url"        TEXT,
  "created_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),
  "deleted_at"        TIMESTAMPTZ
);

CREATE INDEX "users_email_idx" ON "users" ("email");
CREATE INDEX "users_deleted_at_idx" ON "users" ("deleted_at");

-- ────────────────────────── PASSKEYS ──────────────────────────
CREATE TABLE "passkeys" (
  "id"                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"               UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "credential_id"         TEXT NOT NULL UNIQUE,
  "credential_public_key" BYTEA NOT NULL,
  "counter"               BIGINT NOT NULL DEFAULT 0,
  "transports"            VARCHAR(20)[] NOT NULL DEFAULT '{}',
  "device_name"           VARCHAR(120) NOT NULL DEFAULT '',
  "created_at"            TIMESTAMPTZ NOT NULL DEFAULT now(),
  "last_used_at"          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "passkeys_user_id_idx" ON "passkeys" ("user_id");

-- ────────────────────────── WORKSPACES ──────────────────────────
CREATE TABLE "workspaces" (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"             VARCHAR(120) NOT NULL DEFAULT 'My Expenses',
  "owner_id"         UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "legacy_sync_code" VARCHAR(10) UNIQUE,
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "workspaces_owner_id_idx" ON "workspaces" ("owner_id");

-- ────────────────────────── MEMBERSHIPS ──────────────────────────
CREATE TABLE "memberships" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"      UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "role"         "MemberRole" NOT NULL DEFAULT 'MEMBER',
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("user_id", "workspace_id")
);

CREATE INDEX "memberships_workspace_id_idx" ON "memberships" ("workspace_id");

-- ────────────────────────── DEVICES ──────────────────────────
CREATE TABLE "devices" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"        UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "workspace_id"   UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "name"           VARCHAR(120) NOT NULL DEFAULT 'Unknown Device',
  "platform"       VARCHAR(40) NOT NULL DEFAULT 'web',
  "user_agent"     VARCHAR(512),
  "last_active_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "revoked_at"     TIMESTAMPTZ,
  "created_at"     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "devices_user_id_idx" ON "devices" ("user_id");
CREATE INDEX "devices_workspace_id_idx" ON "devices" ("workspace_id");
CREATE INDEX "devices_revoked_at_idx" ON "devices" ("revoked_at");

-- ────────────────────────── SESSIONS ──────────────────────────
CREATE TABLE "sessions" (
  "id"                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"            UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "device_id"          UUID NOT NULL REFERENCES "devices"("id") ON DELETE CASCADE,
  "refresh_token_hash" VARCHAR(128) NOT NULL,
  "user_agent"         VARCHAR(512),
  "ip_hash"            VARCHAR(64),
  "created_at"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "expires_at"         TIMESTAMPTZ NOT NULL,
  "revoked_at"         TIMESTAMPTZ
);

CREATE INDEX "sessions_user_id_idx" ON "sessions" ("user_id");
CREATE INDEX "sessions_refresh_token_hash_idx" ON "sessions" ("refresh_token_hash");
CREATE INDEX "sessions_expires_at_idx" ON "sessions" ("expires_at");

-- ────────────────────────── INVITES ──────────────────────────
CREATE TABLE "invites" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "inviter_id"   UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash"   VARCHAR(128) NOT NULL UNIQUE,
  "role"         "MemberRole" NOT NULL DEFAULT 'MEMBER',
  "expires_at"   TIMESTAMPTZ NOT NULL,
  "used_at"      TIMESTAMPTZ,
  "revoked_at"   TIMESTAMPTZ,
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "invites_workspace_id_idx" ON "invites" ("workspace_id");
CREATE INDEX "invites_expires_at_idx" ON "invites" ("expires_at");

-- ────────────────────────── DEVICE LINKS ──────────────────────────
CREATE TABLE "device_links" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "user_id"      UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash"   VARCHAR(128) NOT NULL UNIQUE,
  "expires_at"   TIMESTAMPTZ NOT NULL,
  "used_at"      TIMESTAMPTZ,
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "device_links_workspace_id_idx" ON "device_links" ("workspace_id");
CREATE INDEX "device_links_expires_at_idx" ON "device_links" ("expires_at");

-- ────────────────────────── AUDIT LOGS ──────────────────────────
CREATE TABLE "audit_logs" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"     UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "entity_type" VARCHAR(50) NOT NULL,
  "entity_id"   VARCHAR(64) NOT NULL,
  "action"      VARCHAR(30) NOT NULL,
  "meta"        JSONB,
  "ip_hash"     VARCHAR(64),
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs" ("user_id", "created_at" DESC);
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs" ("entity_type", "entity_id");

-- ────────────────────────── EXPENSES ──────────────────────────
CREATE TABLE "expenses" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "category"     VARCHAR(60) NOT NULL,
  "amount"       DECIMAL(14,2) NOT NULL,
  "day"          SMALLINT NOT NULL,
  "month"        SMALLINT NOT NULL,
  "year"         SMALLINT NOT NULL,
  "remark"       VARCHAR(255),
  "is_recurring" BOOLEAN NOT NULL DEFAULT FALSE,
  "recurring_id" VARCHAR(64),
  "version"      INTEGER NOT NULL DEFAULT 1,
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "deleted_at"   TIMESTAMPTZ
);

CREATE INDEX "expenses_workspace_id_month_year_idx" ON "expenses" ("workspace_id", "month", "year");
CREATE INDEX "expenses_workspace_id_updated_at_idx" ON "expenses" ("workspace_id", "updated_at");
CREATE INDEX "expenses_workspace_id_deleted_at_idx" ON "expenses" ("workspace_id", "deleted_at");

-- ────────────────────────── WORKSPACE SETTINGS ──────────────────────────
CREATE TABLE "workspace_settings" (
  "workspace_id"         UUID PRIMARY KEY REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "salary"               DECIMAL(14,2) NOT NULL DEFAULT 0,
  "currency"             VARCHAR(3) NOT NULL DEFAULT 'INR',
  "categories"           JSONB NOT NULL DEFAULT '[]',
  "custom_categories"    JSONB NOT NULL DEFAULT '[]',
  "hidden_defaults"      JSONB NOT NULL DEFAULT '[]',
  "category_budgets"     JSONB NOT NULL DEFAULT '{}',
  "recurring_expenses"   JSONB NOT NULL DEFAULT '[]',
  "saved_filters"        JSONB NOT NULL DEFAULT '[]',
  "goals"                JSONB NOT NULL DEFAULT '[]',
  "rollover_enabled"     BOOLEAN NOT NULL DEFAULT FALSE,
  "rollover_history"     JSONB NOT NULL DEFAULT '{}',
  "business_mode"        BOOLEAN NOT NULL DEFAULT FALSE,
  "revenue_expectations" JSONB NOT NULL DEFAULT '[]',
  "business_tags"        JSONB NOT NULL DEFAULT '[]',
  "version"              INTEGER NOT NULL DEFAULT 1,
  "updated_at"           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────── BUSINESS LEDGERS ──────────────────────────
CREATE TABLE "business_ledgers" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id"    UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "name"            VARCHAR(200) NOT NULL,
  "expected_amount" DECIMAL(14,2) NOT NULL,
  "currency"        VARCHAR(3) NOT NULL DEFAULT 'INR',
  "status"          VARCHAR(20) NOT NULL DEFAULT 'active',
  "due_date"        DATE,
  "tags"            JSONB NOT NULL DEFAULT '[]',
  "notes"           TEXT NOT NULL DEFAULT '',
  "version"         INTEGER NOT NULL DEFAULT 1,
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "deleted_at"      TIMESTAMPTZ
);

CREATE INDEX "business_ledgers_workspace_id_status_idx" ON "business_ledgers" ("workspace_id", "status");
CREATE INDEX "business_ledgers_workspace_id_updated_at_idx" ON "business_ledgers" ("workspace_id", "updated_at");

-- ────────────────────────── BUSINESS PAYMENTS ──────────────────────────
CREATE TABLE "business_payments" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "ledger_id"    UUID NOT NULL REFERENCES "business_ledgers"("id") ON DELETE CASCADE,
  "amount"       DECIMAL(14,2) NOT NULL,
  "date"         DATE NOT NULL,
  "method"       VARCHAR(30),
  "reference"    VARCHAR(200),
  "notes"        TEXT,
  "version"      INTEGER NOT NULL DEFAULT 1,
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "deleted_at"   TIMESTAMPTZ
);

CREATE INDEX "business_payments_workspace_id_ledger_id_idx" ON "business_payments" ("workspace_id", "ledger_id");
CREATE INDEX "business_payments_workspace_id_updated_at_idx" ON "business_payments" ("workspace_id", "updated_at");

-- ────────────────────────── SYNC CURSORS ──────────────────────────
CREATE TABLE "sync_cursors" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "device_id"    VARCHAR(64) NOT NULL,
  "table_name"   VARCHAR(60) NOT NULL,
  "cursor"       TIMESTAMPTZ NOT NULL,
  "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("workspace_id", "device_id", "table_name")
);

COMMIT;
