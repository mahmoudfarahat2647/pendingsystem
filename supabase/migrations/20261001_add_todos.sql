-- Header To-Do list (issue #360).
-- System-wide tasks shown behind the header's to-do icon. Reached only through
-- the authenticated /api/todos routes with the service role: RLS is enabled
-- with no anon/authenticated policy, so the browser anon key cannot read or
-- write this table directly.
--
-- due_date is a plain local calendar day (no timezone shift); due_time is an
-- optional 24h "HH:mm" (null = all-day).

CREATE TABLE IF NOT EXISTS public.todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  note text CHECK (note IS NULL OR char_length(note) <= 1000),
  due_date date NOT NULL,
  due_time text CHECK (due_time IS NULL OR due_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  is_done boolean NOT NULL DEFAULT false,
  done_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS todos_open_due_idx ON public.todos (is_done, due_date);

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
