-- Enable RLS on all tables that were previously exposed without it.
-- App uses service_role_key and Better Auth direct pg — both bypass RLS.
-- No policies needed; PostgREST access is intentionally blocked for anon/authenticated.

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Drop dead "Enable all access for all users" policies — these were never active
-- (RLS was off) and would grant anon full access if left in place.
DROP POLICY IF EXISTS "Enable all access for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.order_notes;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.order_attachments;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.order_links;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.order_reminders;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.bookings;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.report_settings;

-- Revoke anon/authenticated execute on SECURITY DEFINER function.
REVOKE EXECUTE ON FUNCTION public.get_database_size_bytes() FROM anon, authenticated;

-- Lock search_path on all affected functions to prevent search_path injection.
ALTER FUNCTION public.get_database_size_bytes() SET search_path = public;
ALTER FUNCTION public.fn_log_order_activity_v2() SET search_path = public;
ALTER FUNCTION public.fn_log_order_activity_v5() SET search_path = public;
ALTER FUNCTION public.check_rate_limit(p_ip text, p_max_requests integer) SET search_path = public;
ALTER FUNCTION public.prune_rate_limits() SET search_path = public;
