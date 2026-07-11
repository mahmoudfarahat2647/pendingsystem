-- Migration: Create get_order_stage_counts() RPC
-- Returns per-stage row counts plus the distinct VIN count within the "call"
-- stage in a single aggregate query, replacing the dashboard's previous
-- approach of fetching every row's id/vin/stage and counting client-side.
--
-- NULLIF(vin, '') before COUNT(DISTINCT ...) reproduces the client's prior
-- `.filter(Boolean)` semantics exactly: NULL vins are already excluded by
-- COUNT(DISTINCT), and NULLIF additionally drops empty-string vins so the
-- aggregate matches the old client-computed value for every input.

CREATE OR REPLACE FUNCTION public.get_order_stage_counts()
RETURNS TABLE(stage text, row_count bigint, call_unique_vehicles bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    stage,
    COUNT(*) AS row_count,
    COUNT(DISTINCT NULLIF(vin, '')) FILTER (WHERE stage = 'call')
      AS call_unique_vehicles
  FROM public.orders
  GROUP BY stage;
$$;

-- The dashboard reads this over the anon client (same exposure level as the
-- existing full-row orders select it replaces, but with far less data).
REVOKE EXECUTE ON FUNCTION public.get_order_stage_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_stage_counts()
  TO anon, authenticated, service_role;
