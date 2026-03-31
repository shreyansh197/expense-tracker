-- Add currency column to expenses table (backward-compatible)
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3);
