-- Chassis-level "release" follow-up schedule for the warranty low-mileage
-- release gate (issue #242). One row per normalized VIN: the next date the
-- user should be re-nudged to confirm release into Call List, set when a
-- release confirmation modal is cancelled and re-set (snoozed) either
-- automatically every two calendar months or when the user dismisses the
-- resulting notification.
--
-- Client access mirrors the existing anon-write model used by `orders` and
-- `order_reminders` (see 20260623_enable_rls_and_fix_security.sql — RLS is
-- enabled but PostgREST access for this app is granted to anon directly).
CREATE TABLE IF NOT EXISTS public.release_follow_ups (
  vin TEXT PRIMARY KEY,
  next_due_at TIMESTAMPTZ NOT NULL,
  reference_row_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS release_follow_ups_next_due_at_idx
  ON public.release_follow_ups (next_due_at);

ALTER TABLE public.release_follow_ups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon full access" ON public.release_follow_ups;
CREATE POLICY "Anon full access" ON public.release_follow_ups
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
