-- Add new settings columns to workspace_settings (backward-compatible)
ALTER TABLE workspace_settings
  ADD COLUMN IF NOT EXISTS multi_currency_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dashboard_layout JSONB,
  ADD COLUMN IF NOT EXISTS dismissed_recurring_suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS auto_rules JSONB NOT NULL DEFAULT '[]'::jsonb;
