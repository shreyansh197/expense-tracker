-- Add achievements and accent_color columns to workspace_settings
ALTER TABLE workspace_settings
  ADD COLUMN IF NOT EXISTS achievements jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS accent_color varchar(20);
