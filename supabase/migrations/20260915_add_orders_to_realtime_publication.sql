-- `public.orders` was never added to the `supabase_realtime` publication, so
-- Postgres has never emitted `postgres_changes` events for it — the existing
-- INSERT-based mobile-order notice, and the UPDATE/DELETE handling added for
-- issue #202, were both silently inert in production regardless of client
-- code correctness. Publishing the table is what actually lets Realtime
-- deliver these events; REPLICA IDENTITY FULL (see the prior migration)
-- only controls how much of the row is included once an event is emitted.
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
