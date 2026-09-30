-- Run this in your Supabase SQL Editor (https://supabase.com → SQL Editor)
-- This creates the expenses table and enables realtime sync.

CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  day INTEGER NOT NULL CHECK (day >= 1 AND day <= 31),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2000),
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Index for fast month/year queries
CREATE INDEX IF NOT EXISTS idx_expenses_month_year
  ON expenses (month, year);

-- Enable Row Level Security (open access since no auth)
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Allow full access (no auth required — personal use)
CREATE POLICY "Allow all operations" ON expenses
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
