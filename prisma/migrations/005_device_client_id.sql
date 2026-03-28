-- Add client_id column to devices table for stable per-browser device identification
ALTER TABLE devices ADD COLUMN client_id VARCHAR(64);
