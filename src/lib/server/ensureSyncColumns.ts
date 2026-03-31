import { prisma } from "./prisma";

/**
 * Idempotent migration: add any columns the Prisma schema expects
 * but that may be missing from the live database.
 *
 * Uses `ADD COLUMN IF NOT EXISTS` so it's safe to run on every cold start.
 * Runs once per process lifetime (cached via _ran flag).
 */

let _ran = false;

export async function ensureSyncColumns(): Promise<void> {
  if (_ran) return;
  _ran = true;

  try {
    // All statements use IF NOT EXISTS — safe to run repeatedly
    await prisma.$executeRawUnsafe(`
      -- Migration 003: Google OAuth
      ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE indexname = 'users_google_id_key'
        ) THEN
          CREATE UNIQUE INDEX users_google_id_key ON users (google_id);
        END IF;
      END $$;

      -- Migration 005: Device client_id
      ALTER TABLE devices ADD COLUMN IF NOT EXISTS client_id VARCHAR(64);

      -- Migration 006: New settings columns
      ALTER TABLE workspace_settings
        ADD COLUMN IF NOT EXISTS multi_currency_enabled BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS dashboard_layout JSONB,
        ADD COLUMN IF NOT EXISTS dismissed_recurring_suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS auto_rules JSONB NOT NULL DEFAULT '[]'::jsonb;

      -- Migration 007: Expense currency column
      ALTER TABLE expenses ADD COLUMN IF NOT EXISTS currency VARCHAR(3);

      -- Migration 008: Monthly budgets
      ALTER TABLE workspace_settings
        ADD COLUMN IF NOT EXISTS monthly_budgets JSONB NOT NULL DEFAULT '{}'::jsonb;
    `);
    console.log("[ensureSyncColumns] Schema migration check complete");
  } catch (err) {
    // Log but don't crash — the queries may still work if columns already exist
    console.error("[ensureSyncColumns] Migration failed (non-fatal):", err);
    // Reset so we retry on next request
    _ran = false;
  }
}
