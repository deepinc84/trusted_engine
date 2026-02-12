create table if not exists projects (
  slug text primary key,
  title text not null,
  service_type text not null,
  neighborhood text not null,
  city text not null,
  province text not null,
  sanitized_geo jsonb not null,
  summary text not null,
  description text not null,
  completed_at date not null,
  images text[] not null default '{}'
);

create unique index if not exists projects_slug_unique_idx on projects (slug);

create table if not exists quote_events (
  id text primary key,
  address text not null,
  city text not null,
  province text not null,
  postal text not null default '',
  lat double precision not null,
  lng double precision not null,
  estimate_low double precision not null,
  estimate_high double precision not null,
  service_type text not null,
  requested_scopes text[] not null default '{}',
  name text,
  phone text,
  email text,
  preferred_contact text,
  created_at timestamptz not null default now()
);

create index if not exists quote_events_created_at_idx on quote_events (created_at desc);
