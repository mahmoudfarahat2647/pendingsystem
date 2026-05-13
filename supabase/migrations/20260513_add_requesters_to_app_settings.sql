ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS requesters JSONB NOT NULL DEFAULT '[]'::jsonb;
