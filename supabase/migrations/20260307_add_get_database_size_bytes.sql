-- Migration: Create get_database_size_bytes() RPC
-- Returns the current database size in bytes for storage monitoring.
-- Used by /api/storage-stats to report DB usage against the free-tier limit.

CREATE OR REPLACE FUNCTION public.get_database_size_bytes()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT pg_database_size(current_database());
$$;

-- Restrict access to this function so only the service_role (admin) can call it.
REVOKE EXECUTE ON FUNCTION public.get_database_size_bytes() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_database_size_bytes() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_database_size_bytes() TO service_role;
