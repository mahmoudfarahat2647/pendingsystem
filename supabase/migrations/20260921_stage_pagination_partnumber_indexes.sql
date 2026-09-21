-- Issue #248 — stage pagination + part-number lookup indexes.
--
-- 1) orders_stage_created_at_id_idx (composite btree on
--    (stage, created_at DESC, id ASC)) serves the stage page reads in
--    createOrderQueryRepository.getOrders(), which filter by stage and order
--    by created_at DESC with an id ASC tiebreak so pages don't skip or
--    duplicate rows when created_at values tie at a page boundary.
--
-- 2) orders_partnumber_trgm_idx (GIN pg_trgm on metadata->>'partNumber')
--    accelerates the ILIKE exact-match prefilters actually shipped in
--    checkHistoricalVinPartDuplicate and checkHistoricalDescriptionConflict
--    (ILIKE with a fully escaped literal, no active wildcards).
--
-- Deferred: orders_partnumber_upper_idx (functional btree on
-- upper(metadata->>'partNumber')) — reintroduce with the RPC/direct-SQL
-- upper()=equality path.
--
-- NOTE: no live DB was available in this lane, so EXPLAIN (ANALYZE,
-- BUFFERS) must be run on staging post-merge for both the stage-ordered
-- page query and the ILIKE prefilter (including a <3-char part number
-- boundary case, which pg_trgm cannot serve) before relying on these
-- indexes. If the GIN index proves unused there, the path forward is
-- rewriting the prefilters to an upper()-equality path (via RPC, served
-- by a reintroduced functional index) or dropping both part-number
-- indexes — never keeping the functional index alone under the ILIKE
-- shape. All three statements below are additive IF NOT EXISTS with zero
-- behavior change.

CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "extensions";

CREATE INDEX IF NOT EXISTS orders_stage_created_at_id_idx
  ON public.orders (stage, created_at DESC, id ASC);

CREATE INDEX IF NOT EXISTS orders_partnumber_trgm_idx
  ON public.orders USING gin ((metadata->>'partNumber') gin_trgm_ops);
