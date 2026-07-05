alter table public.poll_settings
add column if not exists poll_starts_at timestamptz;
