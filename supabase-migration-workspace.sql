-- ═══════════════════════════════════════════════════════════════
-- Migration: Legacy sync-code → Account + Workspace model
-- 
-- This script creates workspaces from existing device_id values
-- and migrates all domain data. Run AFTER Prisma migrate has
-- created the new schema tables.
-- ═══════════════════════════════════════════════════════════════

-- Step 1: Create a system "migration" user to own migrated workspaces.
-- Real users will "claim" ownership when they register.
INSERT INTO users (id, email, name, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'system@migration.internal',
  'Migration System',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Step 2: Create one workspace per unique device_id (sync code).
-- Collects all distinct device_id values from expenses + business tables.
INSERT INTO workspaces (id, name, owner_id, legacy_sync_code, created_at, updated_at)
SELECT
  gen_random_uuid(),
  'Migrated (' || device_id || ')',
  '00000000-0000-0000-0000-000000000001',
  device_id,
  MIN(created_at),
  NOW()
FROM (
  SELECT device_id, created_at FROM expenses WHERE device_id IS NOT NULL
  UNION
  SELECT device_id, created_at FROM business_ledgers WHERE device_id IS NOT NULL
) AS all_codes
GROUP BY device_id
ON CONFLICT (legacy_sync_code) DO NOTHING;

-- Also create workspaces for sync codes that only exist in user_settings
INSERT INTO workspaces (id, name, owner_id, legacy_sync_code, created_at, updated_at)
SELECT
  gen_random_uuid(),
  'Migrated (' || sync_code || ')',
  '00000000-0000-0000-0000-000000000001',
  sync_code,
  COALESCE(updated_at, NOW()),
  NOW()
FROM user_settings
WHERE sync_code IS NOT NULL
  AND sync_code NOT IN (SELECT legacy_sync_code FROM workspaces WHERE legacy_sync_code IS NOT NULL)
ON CONFLICT (legacy_sync_code) DO NOTHING;

-- Step 3: Create workspace_settings from user_settings
INSERT INTO workspace_settings (
  workspace_id, salary, currency, categories, custom_categories,
  hidden_defaults, category_budgets, recurring_expenses, saved_filters,
  goals, rollover_enabled, rollover_history, business_mode,
  revenue_expectations, business_tags, version, updated_at
)
SELECT
  w.id,
  COALESCE(us.salary, 0),
  COALESCE(us.currency, 'INR'),
  COALESCE(us.categories, '[]'::jsonb),
  COALESCE(us.custom_categories, '[]'::jsonb),
  COALESCE(us.hidden_defaults, '[]'::jsonb),
  COALESCE(us.category_budgets, '{}'::jsonb),
  COALESCE(us.recurring_expenses, '[]'::jsonb),
  COALESCE(us.saved_filters, '[]'::jsonb),
  COALESCE(us.goals, '[]'::jsonb),
  COALESCE(us.rollover_enabled, false),
  COALESCE(us.rollover_history, '{}'::jsonb),
  COALESCE(us.business_mode, false),
  COALESCE(us.revenue_expectations, '[]'::jsonb),
  COALESCE(us.business_tags, '[]'::jsonb),
  1,
  NOW()
FROM workspaces w
JOIN user_settings us ON us.sync_code = w.legacy_sync_code
ON CONFLICT (workspace_id) DO NOTHING;

-- Step 4: Migrate expenses (add workspace_id, copy from device_id mapping)
-- First, add workspace_id column to the existing expenses table if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN workspace_id UUID;
  END IF;
END $$;

UPDATE expenses e
SET workspace_id = w.id
FROM workspaces w
WHERE w.legacy_sync_code = e.device_id
  AND e.workspace_id IS NULL;

-- Step 5: Migrate business_ledgers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_ledgers' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE business_ledgers ADD COLUMN workspace_id UUID;
  END IF;
END $$;

UPDATE business_ledgers bl
SET workspace_id = w.id
FROM workspaces w
WHERE w.legacy_sync_code = bl.device_id
  AND bl.workspace_id IS NULL;

-- Step 6: Migrate business_payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_payments' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE business_payments ADD COLUMN workspace_id UUID;
  END IF;
END $$;

UPDATE business_payments bp
SET workspace_id = w.id
FROM workspaces w
WHERE w.legacy_sync_code = bp.device_id
  AND bp.workspace_id IS NULL;

-- Step 7: Add version column to existing tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'version'
  ) THEN
    ALTER TABLE expenses ADD COLUMN version INTEGER DEFAULT 1;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_ledgers' AND column_name = 'version'
  ) THEN
    ALTER TABLE business_ledgers ADD COLUMN version INTEGER DEFAULT 1;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_payments' AND column_name = 'version'
  ) THEN
    ALTER TABLE business_payments ADD COLUMN version INTEGER DEFAULT 1;
  END IF;
END $$;

-- Step 8: Tighten RLS policies (replace wide-open USING(true))
-- After migration, data should be scoped by workspace_id via API.
-- Keep RLS enabled but restrict to authenticated service role only.
-- The client no longer talks directly to Supabase for CRUD.

-- NOTE: RLS policies should be updated in a separate migration
-- after verifying all data has been migrated successfully.
-- For now, keep existing policies to avoid breaking the compat window.

-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (run after migration)
-- ═══════════════════════════════════════════════════════════════

-- Count workspaces created:
-- SELECT COUNT(*) FROM workspaces WHERE legacy_sync_code IS NOT NULL;

-- Verify all expenses have workspace_id:
-- SELECT COUNT(*) FROM expenses WHERE workspace_id IS NULL AND device_id IS NOT NULL;

-- Verify all ledgers have workspace_id:
-- SELECT COUNT(*) FROM business_ledgers WHERE workspace_id IS NULL AND device_id IS NOT NULL;

-- Verify all payments have workspace_id:
-- SELECT COUNT(*) FROM business_payments WHERE workspace_id IS NULL AND device_id IS NOT NULL;
