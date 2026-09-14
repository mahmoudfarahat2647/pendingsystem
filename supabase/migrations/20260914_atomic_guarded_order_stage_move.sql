-- Atomically move selected rows only when no row with the same normalized VIN
-- is frozen. Locking every sibling VIN row makes a concurrent freeze move
-- serialize with this check-and-update instead of slipping between two client
-- requests.
CREATE OR REPLACE FUNCTION public.auto_move_orders_to_stage_if_unfrozen(
	p_ids uuid[],
	p_source_stage public.order_stage,
	p_stage public.order_stage
)
RETURNS TABLE(moved_ids uuid[], blocked_vins text[])
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
	v_blocked_vins text[];
	v_moved_ids uuid[];
BEGIN
	IF COALESCE(array_length(p_ids, 1), 0) = 0 THEN
		RETURN QUERY SELECT ARRAY[]::uuid[], ARRAY[]::text[];
		RETURN;
	END IF;

	-- Lock candidates and every nonblank sibling with the same normalized VIN.
	-- A competing stage update must wait until the guard result is finalized.
	PERFORM 1
	FROM public.orders AS related
	WHERE related.id = ANY(p_ids)
		OR (
			NULLIF(btrim(related.vin), '') IS NOT NULL
			AND EXISTS (
				SELECT 1
				FROM public.orders AS candidate
				WHERE candidate.id = ANY(p_ids)
					AND NULLIF(btrim(candidate.vin), '') IS NOT NULL
					AND upper(btrim(candidate.vin)) = upper(btrim(related.vin))
			)
		)
	FOR UPDATE;

	SELECT array_agg(DISTINCT upper(btrim(frozen.vin)))
	INTO v_blocked_vins
	FROM public.orders AS frozen
	JOIN public.orders AS candidate
		ON candidate.id = ANY(p_ids)
		AND NULLIF(btrim(candidate.vin), '') IS NOT NULL
		AND upper(btrim(frozen.vin)) = upper(btrim(candidate.vin))
	WHERE frozen.stage = 'freeze';

	IF COALESCE(array_length(v_blocked_vins, 1), 0) > 0 THEN
		RETURN QUERY SELECT ARRAY[]::uuid[], v_blocked_vins;
		RETURN;
	END IF;

	WITH moved AS (
		UPDATE public.orders
		SET stage = p_stage
		WHERE id = ANY(p_ids)
			AND stage = p_source_stage
		RETURNING id
	)
	SELECT COALESCE(array_agg(id), ARRAY[]::uuid[])
	INTO v_moved_ids
	FROM moved;

	RETURN QUERY SELECT v_moved_ids, ARRAY[]::text[];
END;
$$;

REVOKE EXECUTE ON FUNCTION public.auto_move_orders_to_stage_if_unfrozen(uuid[], public.order_stage, public.order_stage) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auto_move_orders_to_stage_if_unfrozen(uuid[], public.order_stage, public.order_stage) TO anon, authenticated, service_role;
