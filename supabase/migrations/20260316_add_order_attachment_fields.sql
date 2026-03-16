alter table public.orders
add column if not exists attachment_link text,
add column if not exists attachment_file_path text;
