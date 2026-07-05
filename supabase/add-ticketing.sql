create extension if not exists "pgcrypto";

create table if not exists public.ticket_settings (
  id text primary key default 'main',
  is_live boolean not null default false,
  total_tickets integer not null default 0 check (total_tickets >= 0),
  booking_starts_at timestamptz,
  booking_closes_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_code text not null unique,
  device_id text not null unique,
  voter_id uuid references public.voters(id) on delete set null,
  movie_id text references public.movies(id) on delete set null,
  student_name text not null,
  year text not null check (
    year in ('1st Year', '2nd Year', '3rd Year', '4th Year')
  ),
  department text not null check (
    department in ('CSE', 'ECE', 'EEE', 'ME', 'CE', 'AI/DS', 'MCA', 'Other')
  ),
  qr_payload text not null,
  created_at timestamptz not null default now()
);

alter table public.ticket_settings
  add column if not exists is_live boolean not null default false,
  add column if not exists total_tickets integer not null default 0,
  add column if not exists booking_starts_at timestamptz,
  add column if not exists booking_closes_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists tickets_created_at_idx on public.tickets(created_at);
create index if not exists tickets_movie_id_idx on public.tickets(movie_id);
create index if not exists tickets_department_idx on public.tickets(department);
create index if not exists tickets_ticket_code_idx on public.tickets(ticket_code);

insert into public.ticket_settings (id, is_live, total_tickets)
values ('main', false, 0)
on conflict (id) do nothing;
