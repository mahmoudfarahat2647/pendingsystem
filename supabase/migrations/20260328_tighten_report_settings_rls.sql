-- Tighten report_settings RLS policies.
--
-- Context: This is a single-tenant admin-only system. The `report_settings`
-- table holds exactly one configuration row auto-created by the service on
-- first access. Policies remain on the `anon` role because the app uses the
-- Supabase anon key. The real access gate is the app's auth layer.
--
-- Changes: Replace the broad "Allow all operations for anon" policy with
-- separate SELECT/UPDATE/INSERT policies. DELETE is intentionally omitted —
-- the service never deletes the settings row.

DROP POLICY IF EXISTS "Allow all operations for anon" ON report_settings;

-- Read settings
CREATE POLICY "Anon can read report settings"
ON report_settings FOR SELECT
TO anon
USING (true);

-- Update existing settings row
CREATE POLICY "Anon can update report settings"
ON report_settings FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Insert the initial row (service auto-creates on first access)
CREATE POLICY "Anon can insert initial report settings"
ON report_settings FOR INSERT
TO anon
WITH CHECK (true);
