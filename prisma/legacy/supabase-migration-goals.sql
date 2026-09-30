-- Run this in your Supabase Dashboard SQL Editor to enable goals & rollover sync
-- Go to: https://supabase.com/dashboard → your project → SQL Editor → paste & run

-- Add savings goals column
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS goals JSONB DEFAULT '[]'::jsonb;

-- Add budget rollover toggle
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS rollover_enabled BOOLEAN DEFAULT false;

-- Add rollover history (stores unspent amounts per month)
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS rollover_history JSONB DEFAULT '{}'::jsonb;
