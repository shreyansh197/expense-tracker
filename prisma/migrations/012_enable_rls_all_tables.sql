-- ══════════════════════════════════════════════════════════════
-- Migration 012: Enable RLS on all public tables
--
-- SECURITY FIX: Resolves Supabase "rls_disabled_in_public" alert.
--
-- All data access goes through Next.js API routes using Prisma with
-- the service role (BYPASSRLS), so no permissive policies are needed.
-- Zero policies = deny all for anon/authenticated roles by default.
-- ══════════════════════════════════════════════════════════════

-- Each table is enabled only if it exists, making this script safe to run
-- regardless of which prior migrations have been applied.
DO $$ DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    -- Auth & identity
    'users', 'passkeys', 'workspaces', 'memberships', 'devices',
    'sessions', 'invites', 'device_links', 'audit_logs', 'verification_tokens',
    -- Domain data
    'expenses', 'workspace_settings', 'business_ledgers', 'business_payments',
    'sync_cursors', 'push_subscriptions',
    -- Legacy (pre-002 clean-slate migration)
    'user_settings'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
      RAISE NOTICE 'RLS enabled on %', tbl;
    ELSE
      RAISE NOTICE 'Skipped % (table does not exist)', tbl;
    END IF;
  END LOOP;
END $$;
