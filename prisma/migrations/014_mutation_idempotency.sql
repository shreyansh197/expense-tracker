-- ══════════════════════════════════════════════════════════════
-- Migration 014: Mutation idempotency — guaranteed-once delivery
--
-- Sprint 2.2 / T-2.2.3 — Persistent Mutation Queue.
--
-- What this does
-- ──────────────
-- 1. Ensures the `processed_idempotency_keys` ledger exists (belt-and-braces
--    for environments where `ensureSyncColumns` has not yet run).
-- 2. Adds an `entity_id` column so replays can return the ORIGINAL entity id
--    (identical body) instead of a fresh insert.
-- 3. Adds an explicit named UNIQUE index on `(workspace_id, idempotency_key)`.
--    The composite PRIMARY KEY already provides uniqueness — the named index
--    formalises the invariant so downstream tooling (Prisma introspection,
--    monitoring, DBA reviews) can reason about it without inspecting the PK.
-- 4. Enables ROW LEVEL SECURITY. The table is only ever accessed through
--    Prisma using the service role (BYPASSRLS), so zero policies = deny-all
--    for anon / authenticated roles — mirroring migration 012.
--
-- Reversibility
-- ─────────────
-- To roll back:
--   ALTER TABLE processed_idempotency_keys DISABLE ROW LEVEL SECURITY;
--   DROP INDEX IF EXISTS processed_idempotency_keys_workspace_key_uidx;
--   ALTER TABLE processed_idempotency_keys DROP COLUMN IF EXISTS entity_id;
-- (The table itself is not dropped — it may hold in-flight dedup entries.)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "processed_idempotency_keys" (
  "idempotency_key" VARCHAR(64)  NOT NULL,
  "workspace_id"    UUID         NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "processed_at"    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  PRIMARY KEY ("workspace_id", "idempotency_key")
);

-- Replay support: id of the entity that was created/updated by the first
-- successful apply. Nullable for pre-existing rows and for mutations that
-- do not map to a single entity (settings upserts).
ALTER TABLE "processed_idempotency_keys"
  ADD COLUMN IF NOT EXISTS "entity_id" VARCHAR(64);

-- Explicit named unique index — redundant with the PK but explicit for
-- Prisma introspection and DBA reviews.
CREATE UNIQUE INDEX IF NOT EXISTS "processed_idempotency_keys_workspace_key_uidx"
  ON "processed_idempotency_keys" ("workspace_id", "idempotency_key");

-- Cleanup index for future TTL sweeps (mutation dedup entries older than
-- 30 days can be safely purged since the client queue also caps at 500).
CREATE INDEX IF NOT EXISTS "processed_idempotency_keys_processed_at_idx"
  ON "processed_idempotency_keys" ("processed_at");

-- RLS: deny-all for anon / authenticated. Matches migration 012 policy.
ALTER TABLE "processed_idempotency_keys" ENABLE ROW LEVEL SECURITY;
