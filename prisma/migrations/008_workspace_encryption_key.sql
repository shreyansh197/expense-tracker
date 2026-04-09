-- Add client-side encryption key column to workspaces
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS encryption_key VARCHAR(64);

COMMENT ON COLUMN workspaces.encryption_key IS 'AES-256 key (base64) for client-side at-rest encryption. Generated on first access.';
