-- Migration: Create user_settings table for syncing budget, categories across devices
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

CREATE TABLE IF NOT EXISTS user_settings (
  sync_code    TEXT PRIMARY KEY,
  salary       NUMERIC NOT NULL DEFAULT 59400,
  currency     TEXT NOT NULL DEFAULT 'INR',
  categories   JSONB NOT NULL DEFAULT '[]'::jsonb,
  custom_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  hidden_defaults   JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Open RLS (matching expenses table — no auth)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on user_settings"
  ON user_settings FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable real-time so other devices get live updates
ALTER PUBLICATION supabase_realtime ADD TABLE user_settings;
