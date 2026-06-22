-- Migration: Create get_storage_size_bytes() RPC
-- Returns total storage bucket usage in bytes for storage monitoring.
-- Replaces the recursive bucket listing in /api/storage-stats with a single
-- aggregate over storage.objects (mirrors get_database_size_bytes).

CREATE OR REPLACE FUNCTION public.get_storage_size_bytes()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(SUM((metadata->>'size')::bigint), 0)
  FROM storage.objects;
$$;

-- Restrict access to this function so only the service_role (admin) can call it.
REVOKE EXECUTE ON FUNCTION public.get_storage_size_bytes() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_storage_size_bytes() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_storage_size_bytes() TO service_role;
