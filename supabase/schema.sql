create extension if not exists "pgcrypto";

create table if not exists public.movies (
  -- Static frontend movie IDs such as 'movie-1' are intentionally stored as text.
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
  ip_hash text,
  user_agent_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.voters
  add column if not exists device_id text,
  add column if not exists name text,
  add column if not exists year_of_study text,
  add column if not exists department text,
  add column if not exists ip_hash text,
  add column if not exists user_agent_hash text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'voters'
      and column_name = 'year'
  ) then
    update public.voters
    set year_of_study = year
    where year_of_study is null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'voters_device_id_key'
      and conrelid = 'public.voters'::regclass
  ) then
    alter table public.voters
      add constraint voters_device_id_key unique (device_id);
  end if;
end
$$;

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  -- References public.movies(id), which is text for the MVP static movie list.
  movie_id text not null references public.movies(id) on delete restrict,
  voter_id uuid references public.voters(id) on delete set null,
  device_id text not null unique,
  ip_hash text,
  user_agent_hash text,
  voted_at timestamptz not null default now()
);

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

create table if not exists public.poll_settings (
  id text primary key default 'main',
  poll_title text not null default 'CineVote Movie Screening',
  is_open boolean not null default true,
  event_status text not null default 'coming_soon',
  poll_starts_at timestamptz,
  poll_closes_at timestamptz,
  event_date timestamptz,
  venue text,
  screening_note text not null default 'Screening date coming soon. Stay tuned for the final announcement.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

alter table public.poll_settings
  add column if not exists poll_starts_at timestamptz,
  add column if not exists poll_closes_at timestamptz,
  add column if not exists event_date timestamptz,
  add column if not exists venue text;

alter table public.ticket_settings
  add column if not exists is_live boolean not null default false,
  add column if not exists total_tickets integer not null default 0,
  add column if not exists booking_starts_at timestamptz,
  add column if not exists booking_closes_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists movies_sort_order_idx on public.movies(sort_order);
create index if not exists movies_is_active_idx on public.movies(is_active);
create index if not exists voters_department_idx on public.voters(department);
create index if not exists voters_year_of_study_idx on public.voters(year_of_study);
create index if not exists voters_ip_hash_idx on public.voters(ip_hash);
create index if not exists votes_movie_id_idx on public.votes(movie_id);
create index if not exists votes_voted_at_idx on public.votes(voted_at);
create index if not exists votes_ip_hash_idx on public.votes(ip_hash);
create index if not exists vote_attempts_ip_hash_created_at_idx on public.vote_attempts(ip_hash, created_at);
create index if not exists vote_attempts_device_id_created_at_idx on public.vote_attempts(device_id, created_at);
create index if not exists vote_attempts_status_created_at_idx on public.vote_attempts(status, created_at);
create index if not exists tickets_created_at_idx on public.tickets(created_at);
create index if not exists tickets_movie_id_idx on public.tickets(movie_id);
create index if not exists tickets_department_idx on public.tickets(department);
create index if not exists tickets_ticket_code_idx on public.tickets(ticket_code);

insert into public.movies (
  id,
  title,
  language,
  genre,
  runtime,
  rating,
  hook,
  summary,
  why_screen,
  poster_url,
  backdrop_url,
  sort_order
)
values
  (
    'movie-1',
    'Interstellar',
    'English',
    'Sci-Fi',
    '169 min',
    '8.7',
    'A massive space journey built for a dark hall, big sound, and full attention.',
    'A team of explorers travels through a wormhole in search of a new home for humanity, while time, memory, and sacrifice collide across galaxies. Its vast visuals, thunderous score, and emotional scale make it the kind of movie that feels bigger with a student crowd.',
    'It works beautifully for a college screening because the visuals, score, and emotional scale feel much bigger with a crowd.',
    '/movies/movie-1.jpg',
    '/movies/movie-1.jpg',
    1
  ),
  (
    'movie-2',
    'The Dark Knight',
    'English',
    'Action Thriller',
    '152 min',
    '9.0',
    'A tense, crowd-pleasing superhero thriller with iconic moments from start to finish.',
    'Batman faces a criminal mastermind who pushes Gotham into chaos and forces its heroes to make impossible choices. Packed with sharp tension, iconic performances, and explosive set pieces, it is a high-energy screening pick that keeps the room locked in.',
    'The action, performances, and sharp moral stakes make it an easy pick for a high-energy student audience.',
    '/movies/movie-2.jpg',
    '/movies/movie-2.jpg',
    2
  ),
  (
    'movie-3',
    '3 Idiots',
    'Hindi',
    'Comedy Drama',
    '170 min',
    '8.4',
    'A funny, emotional campus story that still hits close to home for students.',
    'Three engineering students navigate friendship, pressure, and ambition while questioning what success should really mean. The comedy is easy to enjoy with a crowd, but the student-life moments give it a warm emotional pull that fits a college screening perfectly.',
    'It is relatable, quotable, and ideal for a mixed crowd because it balances comedy with a strong student-life message.',
    '/movies/movie-3.jpg',
    '/movies/movie-3.jpg',
    3
  ),
  (
    'movie-4',
    'Inception',
    'English',
    'Sci-Fi Thriller',
    '148 min',
    '8.8',
    'A sleek mind-bending thriller that gives the audience plenty to debate after the credits.',
    'A skilled thief enters dreams to steal secrets, then takes on a dangerous mission to plant an idea instead. With layered puzzles, dream-bending action, and a score that fills the room, it gives the audience plenty to talk about after the credits.',
    'Its puzzles, set pieces, and soundtrack make it a strong big-screen option with a lot of post-movie conversation value.',
    '/movies/movie-4.jpg',
    '/movies/movie-4.jpg',
    4
  )
on conflict (id) do update set
  title = excluded.title,
  language = excluded.language,
  genre = excluded.genre,
  runtime = excluded.runtime,
  rating = excluded.rating,
  hook = excluded.hook,
  summary = excluded.summary,
  why_screen = excluded.why_screen,
  poster_url = excluded.poster_url,
  backdrop_url = excluded.backdrop_url,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.poll_settings (id)
values ('main')
on conflict (id) do nothing;

insert into public.ticket_settings (id, is_live, total_tickets)
values ('main', false, 0)
on conflict (id) do nothing;
