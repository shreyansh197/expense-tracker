-- Run this in your Supabase SQL Editor to add device_id support
-- This allows each device/user to have their own expenses

-- Add device_id column (nullable for existing rows)
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS device_id TEXT;

-- Index for fast device+month queries
CREATE INDEX IF NOT EXISTS idx_expenses_device_month
  ON expenses (device_id, month, year);
