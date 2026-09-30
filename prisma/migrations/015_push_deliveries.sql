-- ══════════════════════════════════════════════════════════════
-- Migration 015: push_deliveries — observable push lifecycle
--
-- Sprint 3.1 / T-3.1.2 — Server Scheduler, Retries & Dead-Letter.
--
-- What this does
-- ──────────────
-- 1. Creates `push_deliveries`, giving every scheduled Web Push a durable
--    lifecycle row: pending → sent, or pending → failed (retry) → dead once
--    the exponential-backoff budget (30s → 5min → 30min) is exhausted.
-- 2. `attempts` counts delivery tries; `last_error` records the most recent
--    failure reason (no PII / monetary values — status codes and short
--    messages only). `scheduled_for` is when the next attempt becomes due.
-- 3. Indexes `(status, scheduled_for)` so the per-minute scheduler can select
--    due rows cheaply, plus `(subscription_id)` for prune cascades.
-- 4. FK to `push_subscriptions` with ON DELETE CASCADE so pruning a stale
--    endpoint automatically clears its in-flight deliveries.
-- 5. Enables ROW LEVEL SECURITY. The table is only ever accessed through
--    Prisma using the service role (BYPASSRLS), so zero policies = deny-all
--    for anon / authenticated roles — mirroring migration 012.
--
-- Reversibility
-- ─────────────
-- To roll back:
--   DROP TABLE IF EXISTS "push_deliveries";
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "push_deliveries" (
  "id"              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  "subscription_id" UUID         NOT NULL REFERENCES "push_subscriptions"("id") ON DELETE CASCADE,
  "scheduled_for"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  "attempts"        INTEGER      NOT NULL DEFAULT 0,
  "last_error"      TEXT,
  "status"          VARCHAR(16)  NOT NULL DEFAULT 'pending',
  "payload"         TEXT         NOT NULL,
  "created_at"      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  "updated_at"      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT "push_deliveries_status_check"
    CHECK ("status" IN ('pending', 'sent', 'failed', 'dead'))
);

-- Scheduler hot path: fetch due rows (pending/failed with scheduled_for <= now).
CREATE INDEX IF NOT EXISTS "idx_push_deliveries_status_scheduled_for"
  ON "push_deliveries" ("status", "scheduled_for");

-- Prune / lookup by subscription.
CREATE INDEX IF NOT EXISTS "idx_push_deliveries_subscription_id"
  ON "push_deliveries" ("subscription_id");

-- RLS: deny-all for anon / authenticated. Matches migration 012 policy.
ALTER TABLE "push_deliveries" ENABLE ROW LEVEL SECURITY;
