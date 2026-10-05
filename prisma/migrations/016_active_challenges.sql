-- Add active_challenges column to workspace_settings so spending challenges
-- (started on the dashboard) survive sync pulls instead of being dropped.
ALTER TABLE workspace_settings
  ADD COLUMN IF NOT EXISTS active_challenges jsonb NOT NULL DEFAULT '[]';
