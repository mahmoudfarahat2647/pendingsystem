-- Issue #248 — stage pagination + part-number lookup indexes.
--
-- 1) orders_stage_created_at_id_idx (composite btree on
--    (stage, created_at DESC, id ASC)) serves the stage page reads in
--    createOrderQueryRepository.getOrders(), which filter by stage and order
--    by created_at DESC with an id ASC tiebreak so pages don't skip or
--    duplicate rows when created_at values tie at a page boundary.
--
-- 2) orders_partnumber_upper_idx (functional btree on
--    upper(metadata->>'partNumber')) is the preferred index for a future
--    case-insensitive equality path
--    (upper(metadata->>'partNumber') = upper(?)). It is shipped now but NOT
--    yet addressable from the Supabase client: PostgREST (postgrest-js
--    2.112.3 .eq/.filter/.or) only accepts real columns / JSON-arrow paths
--    as filter targets, not upper(...) expressions, so a client rewrite to
--    equality would be rejected server-side (PGRST204). The two
--    duplicate-detection queries therefore keep their ILIKE exact-match
--    shape (see comments in src/services/order/orderQueryRepository.ts) and
--    are served by index (3) until an RPC / direct-SQL equality path exists.
--
-- 3) orders_partnumber_trgm_idx (GIN pg_trgm on metadata->>'partNumber')
--    accelerates the ILIKE exact-match prefilters actually shipped in
--    checkHistoricalVinPartDuplicate and checkHistoricalDescriptionConflict
--    (ILIKE with a fully escaped literal, no active wildcards).
--
-- NOTE: no live DB was available in this lane, so EXPLAIN ANALYZE
-- verification (index usage for the stage-ordered page query and for the
-- ILIKE part-number prefilters, plan choice with/without pg_trgm) must
-- happen against staging before merge. If the GIN index proves unused
-- there, drop it and keep (1) + (2).

CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "extensions";

CREATE INDEX IF NOT EXISTS orders_stage_created_at_id_idx
  ON public.orders (stage, created_at DESC, id ASC);

CREATE INDEX IF NOT EXISTS orders_partnumber_upper_idx
  ON public.orders ((upper(metadata->>'partNumber')));

CREATE INDEX IF NOT EXISTS orders_partnumber_trgm_idx
  ON public.orders USING gin ((metadata->>'partNumber') gin_trgm_ops);
