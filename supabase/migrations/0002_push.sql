-- ============================================================
-- „Ce fac în oraș" — notificări push (Web Push / VAPID)
-- Rulează în Supabase: SQL Editor → New query → Run.
-- ============================================================

-- Abonamentele push. Anonime (cheia e endpoint-ul unic per device/browser),
-- deci funcționează și fără cont. saved_event_ids ține evenimentele salvate
-- pe acel device, ca să putem trimite remindere personalizate fără login.
create table if not exists push_subscriptions (
  endpoint        text primary key,
  p256dh          text not null,
  auth            text not null,
  saved_event_ids uuid[] not null default '{}',
  wants_general   boolean not null default true,  -- digest „X evenimente diseară"
  wants_reminders boolean not null default true,  -- „evenimentul tău începe curând"
  user_agent      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists push_saved_gin on push_subscriptions using gin (saved_event_ids);

-- Dedup: nu trimitem același reminder de două ori pentru (device, eveniment).
create table if not exists push_sent (
  endpoint   text not null,
  event_id   uuid not null,
  kind       text not null default 'reminder',
  sent_at    timestamptz not null default now(),
  primary key (endpoint, event_id, kind)
);

-- updated_at automat
drop trigger if exists push_set_updated_at on push_subscriptions;
create trigger push_set_updated_at
  before update on push_subscriptions
  for each row execute function set_updated_at();

-- RLS: accesul se face exclusiv prin service_role (rutele /api/push/*),
-- deci nu expunem tabelele clienților anon/authenticated.
alter table push_subscriptions enable row level security;
alter table push_sent          enable row level security;
-- (fără policy = niciun acces pentru anon/authenticated; service_role ocolește RLS)
