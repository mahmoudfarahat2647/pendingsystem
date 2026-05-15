-- Enforce a structural singleton on report_settings.
--
-- The GET /api/report-settings handler previously did a non-atomic
-- read-then-insert: two concurrent first-load requests on an empty table
-- could each observe no row and both insert, creating duplicate UUID-keyed
-- rows that the backup script and UI would silently diverge on.
--
-- Fix: add a sentinel boolean column that is always true and put a unique
-- index on it — PostgreSQL then enforces at most one row forever.
-- The API route is updated to use ON CONFLICT DO NOTHING (upsert) so the
-- auto-create is atomic.

-- Step 1: Remove any duplicate rows, keeping the most recently updated one.
DELETE FROM report_settings
WHERE id NOT IN (
  SELECT id FROM report_settings ORDER BY updated_at DESC LIMIT 1
);

-- Step 2: Add the singleton sentinel column.
ALTER TABLE report_settings
  ADD COLUMN IF NOT EXISTS singleton boolean NOT NULL DEFAULT true;

-- Step 3: Unique index — guarantees at most one row can ever exist.
CREATE UNIQUE INDEX IF NOT EXISTS report_settings_singleton_idx
  ON report_settings (singleton);
