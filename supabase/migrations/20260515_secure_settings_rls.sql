-- Secure settings tables by removing anon write policies.
--
-- Context: report_settings and app_settings writes are now routed through
-- server-side Next.js API routes (/api/report-settings, /api/app-settings)
-- that validate the Better Auth session and use the service-role key.
-- Direct anon writes via the public Supabase REST API are no longer needed.
--
-- report_settings: remove all anon policies (email recipient lists are sensitive).
-- app_settings: remove anon INSERT/UPDATE; keep anon SELECT (non-sensitive model
-- and repair-system lists needed by the public /mobile-order form).

DROP POLICY IF EXISTS "Anon can read report settings" ON report_settings;
DROP POLICY IF EXISTS "Anon can update report settings" ON report_settings;
DROP POLICY IF EXISTS "Anon can insert initial report settings" ON report_settings;

DROP POLICY IF EXISTS "Anon can update app settings" ON app_settings;
DROP POLICY IF EXISTS "Anon can insert initial app settings" ON app_settings;
