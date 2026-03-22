-- Business Owner Mode: Ledgers & Payments tables
-- Run this in the Supabase SQL Editor to enable Business Owner Mode features.

-- 1. business_ledgers table
CREATE TABLE IF NOT EXISTS business_ledgers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  name text NOT NULL,
  expected_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'cancelled')),
  due_date timestamptz,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_ledgers_device_id ON business_ledgers (device_id);
CREATE INDEX IF NOT EXISTS idx_ledgers_status ON business_ledgers (device_id, status) WHERE deleted_at IS NULL;

-- 2. business_payments table
CREATE TABLE IF NOT EXISTS business_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ledger_id uuid NOT NULL REFERENCES business_ledgers (id) ON DELETE CASCADE,
  device_id text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  method text,
  reference text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_payments_device_id ON business_payments (device_id);
CREATE INDEX IF NOT EXISTS idx_payments_ledger_id ON business_payments (ledger_id) WHERE deleted_at IS NULL;

-- 3. Add business columns to user_settings (safe — only if missing)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'business_mode') THEN
    ALTER TABLE user_settings ADD COLUMN business_mode boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'revenue_expectations') THEN
    ALTER TABLE user_settings ADD COLUMN revenue_expectations jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'business_tags') THEN
    ALTER TABLE user_settings ADD COLUMN business_tags jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END$$;

-- 4. Enable RLS (same open-with-anon-key pattern as existing tables)
ALTER TABLE business_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon" ON business_ledgers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON business_payments FOR ALL USING (true) WITH CHECK (true);

-- 5. Enable realtime (required for live sync)
ALTER PUBLICATION supabase_realtime ADD TABLE business_ledgers;
ALTER PUBLICATION supabase_realtime ADD TABLE business_payments;
