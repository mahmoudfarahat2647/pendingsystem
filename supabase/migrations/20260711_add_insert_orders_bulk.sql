-- Migration: Create insert_orders_bulk() RPC
-- Bulk-inserts mobile order-intake rows in a single round trip while still
-- reporting per-row success/failure, preserving the mobile intake service's
-- existing partial-success UX (previously achieved via N separate
-- Promise.allSettled single-row inserts).

CREATE OR REPLACE FUNCTION public.insert_orders_bulk(p_rows jsonb)
RETURNS TABLE(idx int, success boolean, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r jsonb;
  i int := 0;
BEGIN
  FOR r IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
    BEGIN
      INSERT INTO public.orders
        (customer_name, customer_phone, vin, company, stage, metadata)
      VALUES (
        r->>'customer_name',
        r->>'customer_phone',
        r->>'vin',
        r->>'company',
        r->>'stage',
        (r->'metadata')::jsonb
      );
      idx := i;
      success := true;
      error_message := null;
      RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      idx := i;
      success := false;
      error_message := SQLERRM;
      RETURN NEXT;
    END;
    i := i + 1;
  END LOOP;
END;
$$;

-- Called only via the service-role client already used by /api/mobile-order —
-- no anon/authenticated grant needed.
REVOKE EXECUTE ON FUNCTION public.insert_orders_bulk(jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.insert_orders_bulk(jsonb) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.insert_orders_bulk(jsonb) TO service_role;
