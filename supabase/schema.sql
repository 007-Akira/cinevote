create extension if not exists "pgcrypto";

create table if not exists public.movies (
  id text primary key,
  title text not null,
  language text not null,
  genre text not null,
  runtime text not null,
  rating text not null,
  hook text not null,
  summary text not null,
  why_screen text not null,
  poster_url text not null,
  backdrop_url text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.voters (
  id uuid primary key default gen_random_uuid(),
  device_id text not null unique,
  name text not null,
  year_of_study text not null check (
    year_of_study in ('1st Year', '2nd Year', '3rd Year', '4th Year')
  ),
  department text not null check (
    department in ('CSE', 'ECE', 'EEE', 'ME', 'CE', 'AI/DS', 'MCA', 'Other')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  movie_id text not null references public.movies(id) on delete restrict,
  voter_id uuid references public.voters(id) on delete set null,
  device_id text not null unique,
  voted_at timestamptz not null default now()
);

create table if not exists public.poll_settings (
  id boolean primary key default true,
  poll_title text not null default 'CineVote Movie Screening',
  is_voting_open boolean not null default true,
  screening_note text not null default 'Screening date coming soon. Stay tuned for the final announcement.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint poll_settings_singleton check (id)
);

create index if not exists movies_sort_order_idx on public.movies(sort_order);
create index if not exists movies_is_active_idx on public.movies(is_active);
create index if not exists voters_department_idx on public.voters(department);
create index if not exists voters_year_of_study_idx on public.voters(year_of_study);
create index if not exists votes_movie_id_idx on public.votes(movie_id);
create index if not exists votes_voted_at_idx on public.votes(voted_at);

insert into public.poll_settings (id)
values (true)
on conflict (id) do nothing;
