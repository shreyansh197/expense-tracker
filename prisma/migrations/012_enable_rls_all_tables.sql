-- ══════════════════════════════════════════════════════════════
-- Migration 012: Enable RLS on all public tables
--
-- SECURITY FIX: Resolves Supabase "rls_disabled_in_public" alert.
--
-- All data access goes through Next.js API routes using Prisma with
-- the service role (BYPASSRLS), so no permissive policies are needed.
-- Zero policies = deny all for anon/authenticated roles by default.
-- ══════════════════════════════════════════════════════════════

-- ── Auth & identity tables ─────────────────────────────────────
ALTER TABLE "users"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "passkeys"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workspaces"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memberships"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "devices"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invites"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "device_links"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification_tokens" ENABLE ROW LEVEL SECURITY;

-- ── Domain data tables ─────────────────────────────────────────
ALTER TABLE "expenses"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workspace_settings"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "business_ledgers"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "business_payments"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sync_cursors"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "push_subscriptions"  ENABLE ROW LEVEL SECURITY;

-- ── Legacy tables (if they still exist) ───────────────────────
-- These were created by earlier migration scripts before the 002
-- clean-slate migration. Safe to run even if they were dropped.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_settings' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
