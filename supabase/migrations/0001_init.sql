-- ============================================================
-- „Ce fac în oraș" — schema inițială (secțiunea 4 din spec)
-- Rulează acest fișier în Supabase: SQL Editor → New query → Run.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Tabele ----------

create table if not exists cities (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  slug      text not null unique,
  lat       double precision,
  lng       double precision,
  timezone  text default 'Europe/Bucharest'
);

create table if not exists venues (
  id         uuid primary key default gen_random_uuid(),
  city_id    uuid references cities(id) on delete set null,
  name       text not null,
  address    text,
  lat        double precision,
  lng        double precision,
  website    text,
  is_partner boolean not null default false
);

create table if not exists categories (
  id   uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);

create table if not exists sources (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  type           text not null default 'manual'
                   check (type in ('manual','scraper','feed','user_submitted','partner')),
  url            text,
  last_synced_at timestamptz
);

create table if not exists events (
  id                 uuid primary key default gen_random_uuid(),
  city_id            uuid references cities(id) on delete cascade,
  venue_id           uuid references venues(id) on delete set null,
  title              text not null,
  description        text,
  category_id        uuid references categories(id) on delete set null,
  starts_at          timestamptz not null,
  ends_at            timestamptz,
  is_free            boolean not null default false,
  price_min          numeric,
  price_max          numeric,
  is_family_friendly boolean not null default false,
  image_url          text,
  ticket_url         text,
  source_id          uuid references sources(id) on delete set null,
  external_id        text,
  status             text not null default 'draft'
                       check (status in ('draft','published','hidden')),
  is_promoted        boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  -- Evită duplicate din aceeași sursă (secțiunea 6).
  unique (source_id, external_id)
);

create index if not exists events_starts_at_idx on events (starts_at);
create index if not exists events_status_idx on events (status);
create index if not exists events_city_idx on events (city_id);
create index if not exists events_category_idx on events (category_id);

-- Evenimentele salvate de utilizatori (many-to-many users <-> events).
create table if not exists saved_events (
  user_id    uuid not null references auth.users(id) on delete cascade,
  event_id   uuid not null references events(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

-- Lista de admini (după email). Tu te adaugi aici ca să poți edita din /admin.
create table if not exists admins (
  email      text primary key,
  created_at timestamptz not null default now()
);

-- updated_at automat pe events
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists events_set_updated_at on events;
create trigger events_set_updated_at
  before update on events
  for each row execute function set_updated_at();

-- ---------- Row Level Security ----------

alter table cities       enable row level security;
alter table venues       enable row level security;
alter table categories   enable row level security;
alter table sources      enable row level security;
alter table events       enable row level security;
alter table saved_events enable row level security;
alter table admins       enable row level security;

-- Helper: utilizatorul curent este admin?
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from admins a
    where a.email = (auth.jwt() ->> 'email')
  );
$$ language sql stable security definer;

-- Citire publică pentru date de referință.
drop policy if exists "read cities" on cities;
create policy "read cities" on cities for select using (true);

drop policy if exists "read venues" on venues;
create policy "read venues" on venues for select using (true);

drop policy if exists "read categories" on categories;
create policy "read categories" on categories for select using (true);

drop policy if exists "read sources" on sources;
create policy "read sources" on sources for select using (true);

-- Evenimente: oricine vede published; adminii văd tot.
drop policy if exists "read published events" on events;
create policy "read published events" on events
  for select using (status = 'published' or is_admin());

-- Scrieri pe date doar pentru admini.
drop policy if exists "admin write events" on events;
create policy "admin write events" on events
  for all using (is_admin()) with check (is_admin());

drop policy if exists "admin write venues" on venues;
create policy "admin write venues" on venues
  for all using (is_admin()) with check (is_admin());

drop policy if exists "admin write categories" on categories;
create policy "admin write categories" on categories
  for all using (is_admin()) with check (is_admin());

drop policy if exists "admin write sources" on sources;
create policy "admin write sources" on sources
  for all using (is_admin()) with check (is_admin());

drop policy if exists "admin write cities" on cities;
create policy "admin write cities" on cities
  for all using (is_admin()) with check (is_admin());

-- saved_events: fiecare user își gestionează propriile salvări.
drop policy if exists "read own saved" on saved_events;
create policy "read own saved" on saved_events
  for select using (auth.uid() = user_id);

drop policy if exists "insert own saved" on saved_events;
create policy "insert own saved" on saved_events
  for insert with check (auth.uid() = user_id);

drop policy if exists "delete own saved" on saved_events;
create policy "delete own saved" on saved_events
  for delete using (auth.uid() = user_id);

-- admins: doar adminii pot citi lista.
drop policy if exists "admins read" on admins;
create policy "admins read" on admins
  for select using (is_admin());
