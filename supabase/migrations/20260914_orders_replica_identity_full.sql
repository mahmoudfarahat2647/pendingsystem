-- Ensure Realtime UPDATE and DELETE payloads on public.orders contain the
-- full previous row state (specifically `old.stage`), so client-side cache
-- invalidation knows which origin stage cache to purge when a row is frozen
-- or moved.
ALTER TABLE public.orders REPLICA IDENTITY FULL;
