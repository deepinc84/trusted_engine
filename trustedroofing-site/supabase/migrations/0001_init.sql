create extension if not exists pgcrypto;

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  base_sales_copy text,
  created_at timestamptz default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  summary text not null,
  description text,
  service_slug text not null references services(slug),
  city text not null default 'Calgary',
  province text not null default 'AB',
  neighborhood text,
  quadrant text,
  address_private text,
  place_id text,
  geocode_source text,
  lat_private double precision,
  lng_private double precision,
  lat_public double precision,
  lng_public double precision,
  completed_at date,
  created_at timestamptz default now(),
  is_published boolean default true
);

create table if not exists project_photos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  caption text,
  sort_order int default 0,
  is_primary boolean default false,
  address_private text,
  lat_private double precision,
  lng_private double precision,
  lat_public double precision,
  lng_public double precision,
  geocode_source text,
  blurhash text,
  created_at timestamptz default now()
);

create table if not exists quote_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  service_slug text,
  place_id text,
  address_private text,
  lat_private double precision,
  lng_private double precision,
  lat_public double precision,
  lng_public double precision,
  estimate_low numeric,
  estimate_high numeric,
  status text default 'step1'
);

create table if not exists quote_contacts (
  quote_id uuid references quote_events(id) on delete cascade,
  name text,
  email text,
  phone text,
  preferred_contact text,
  created_at timestamptz default now()
);

create table if not exists gbp_post_queue (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  status text default 'pending',
  project_id uuid references projects(id) on delete cascade,
  payload jsonb not null,
  last_error text,
  attempts int default 0
);

create unique index if not exists projects_slug_idx on projects(slug);
create index if not exists quote_events_created_at_idx on quote_events(created_at desc);
create index if not exists project_photos_project_sort_idx on project_photos(project_id, is_primary desc, sort_order asc);
