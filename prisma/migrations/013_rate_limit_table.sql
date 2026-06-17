-- ══════════════════════════════════════════════════════════════
-- Migration 013: Rate limit table for DB-backed rate limiting
--
-- Provides a shared rate limit store safe for multi-instance
-- deployments (replaces the in-memory Map in rateLimit.ts).
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "rate_limits" (
  "key"       VARCHAR(255) NOT NULL,
  "count"     INTEGER      NOT NULL DEFAULT 1,
  "reset_at"  TIMESTAMPTZ  NOT NULL,
  PRIMARY KEY ("key")
);

-- Cleanup index
CREATE INDEX IF NOT EXISTS "rate_limits_reset_at_idx" ON "rate_limits" ("reset_at");

ALTER TABLE "rate_limits" ENABLE ROW LEVEL SECURITY;
