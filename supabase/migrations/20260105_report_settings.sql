create table if not exists report_settings (
  id uuid default gen_random_uuid() primary key,
  emails text[] default array[]::text[],
  frequency text default 'Weekly',
  is_enabled boolean default false,
  last_sent_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table report_settings enable row level security;

-- Create policies (assuming public access for now as per minimal requirements, but typically would restrict to signed-in users)
-- For this "pendingsystem", we'll allow all operations for now to match the "local storage" vibe but essentially prepared for Supabase.
create policy "Allow all operations for anon" on report_settings
  for all using (true) with check (true);
