-- Restore anon access on operational tables.
-- orderService uses the anon-key client directly (not service-role), so RLS
-- with no policies blocks all stage data. RLS stays ON for its other security
-- gains (function hardening, table enumeration prevention).
-- ponytail: full anon access; add per-user row filtering when auth is Supabase-native.

CREATE POLICY "Anon full access" ON public.orders FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access" ON public.order_reminders FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access" ON public.order_attachments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access" ON public.order_links FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access" ON public.order_notes FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access" ON public.bookings FOR ALL TO anon USING (true) WITH CHECK (true);
