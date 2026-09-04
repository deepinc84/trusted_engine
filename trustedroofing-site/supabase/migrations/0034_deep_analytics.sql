-- Consent-gated, anonymous first-party analytics. PII remains in lead tables only.
create table if not exists analytics_visitors (
  id uuid primary key default gen_random_uuid(), visitor_id text not null unique,
  first_seen_at timestamptz not null, last_seen_at timestamptz not null,
  first_source text, first_medium text, first_campaign text, first_referrer text, first_landing_page text
);
create table if not exists analytics_sessions (
  id uuid primary key default gen_random_uuid(), session_id text not null unique,
  visitor_id text not null references analytics_visitors(visitor_id) on delete cascade,
  started_at timestamptz not null, last_seen_at timestamptz not null,
  source text, medium text, campaign text, term text, content text, referrer text, landing_page text,
  gclid text, gbclid text, dclid text, msclkid text, fbclid text,
  device_summary jsonb not null default '{}'::jsonb
);
create table if not exists analytics_events (
  id bigint generated always as identity primary key, event_id text unique,
  visitor_id text not null references analytics_visitors(visitor_id) on delete cascade,
  session_id text not null references analytics_sessions(session_id) on delete cascade,
  event_name text not null, event_timestamp timestamptz not null default now(), page_path text,
  page_title text, event_params jsonb not null default '{}'::jsonb, source text, medium text, campaign text
);
create index if not exists analytics_events_session_time_idx on analytics_events(session_id, event_timestamp);
create index if not exists analytics_events_visitor_time_idx on analytics_events(visitor_id, event_timestamp);
alter table analytics_visitors enable row level security;
alter table analytics_sessions enable row level security;
alter table analytics_events enable row level security;

-- A lead relation without copying contact fields into analytics.
alter table if exists leads add column if not exists analytics_visitor_id text, add column if not exists analytics_session_id text;
alter table if exists instant_quotes add column if not exists analytics_visitor_id text, add column if not exists analytics_session_id text;
notify pgrst, 'reload schema';
