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

create table if not exists instaquote_address_queries (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  place_id text,
  lat numeric(10,7),
  lng numeric(10,7),
  roof_area_sqft integer,
  pitch_degrees numeric(5,1),
  complexity_band text,
  area_source text,
  data_source text,
  queried_at timestamptz default now()
);

create table if not exists instaquote_leads (
  id uuid primary key default gen_random_uuid(),
  address_query_id uuid references instaquote_address_queries(id),
  address text not null,
  place_id text,
  lat numeric(10,7),
  lng numeric(10,7),
  name text not null,
  email text not null,
  phone text not null,
  budget_response text not null,
  timeline text,
  roof_area_sqft integer,
  roof_squares numeric(8,1),
  pitch text,
  good_low integer,
  good_high integer,
  better_low integer,
  better_high integer,
  best_low integer,
  best_high integer,
  eaves_low integer,
  eaves_high integer,
  siding_low integer,
  siding_high integer,
  lead_score integer,
  lead_grade text,
  data_source text,
  source text default 'instantquote',
  email_sent boolean default false,
  email_sent_at timestamptz,
  raw_json jsonb,
  created_at timestamptz default now()
);

create table if not exists instaquote_regional_feedback (
  id uuid primary key default gen_random_uuid(),
  address text,
  place_id text,
  lat numeric(10,7),
  lng numeric(10,7),
  base_sqft integer,
  shown_sqft integer,
  final_sqft integer,
  size_choice text,
  complexity_choice text,
  reason text,
  created_at timestamptz default now()
);

create index if not exists instaquote_address_queries_queried_at_idx on instaquote_address_queries(queried_at desc);
create index if not exists instaquote_address_queries_place_id_idx on instaquote_address_queries(place_id);
create index if not exists instaquote_address_queries_lat_lng_idx on instaquote_address_queries(lat, lng);
create index if not exists instaquote_leads_created_at_idx on instaquote_leads(created_at desc);
create index if not exists instaquote_regional_feedback_created_at_idx on instaquote_regional_feedback(created_at desc);
