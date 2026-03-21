-- Run this in your Supabase Dashboard SQL Editor to enable full sync for new features
-- Go to: https://supabase.com/dashboard → your project → SQL Editor → paste & run

-- Add category budgets column (per-category spending limits)
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS category_budgets JSONB DEFAULT '{}'::jsonb;

-- Add recurring expenses column (auto-add monthly expenses)
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS recurring_expenses JSONB DEFAULT '[]'::jsonb;

-- Add saved filters column (saved search/filter views)
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS saved_filters JSONB DEFAULT '[]'::jsonb;

-- Add is_recurring and recurring_id columns to expenses table
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS recurring_id TEXT DEFAULT NULL;
