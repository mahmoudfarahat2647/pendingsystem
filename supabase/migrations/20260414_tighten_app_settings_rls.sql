-- Harden app_settings with RLS, matching the report_settings pattern
-- (see 20260328_tighten_report_settings_rls.sql).
-- No DELETE policy — the singleton row must never be removable via the anon client.

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Read settings
CREATE POLICY "Anon can read app settings"
ON app_settings FOR SELECT
TO anon
USING (true);

-- Update the singleton row
CREATE POLICY "Anon can update app settings"
ON app_settings FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Allow the initial seed insert (ON CONFLICT DO NOTHING in the create migration)
CREATE POLICY "Anon can insert initial app settings"
ON app_settings FOR INSERT
TO anon
WITH CHECK (id = 1);
