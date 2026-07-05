create table if not exists public.vote_attempts (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  user_agent_hash text,
  device_id text,
  movie_id text,
  status text not null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists vote_attempts_ip_hash_created_at_idx
  on public.vote_attempts(ip_hash, created_at);

create index if not exists vote_attempts_device_id_created_at_idx
  on public.vote_attempts(device_id, created_at);

create index if not exists vote_attempts_status_created_at_idx
  on public.vote_attempts(status, created_at);
