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
  storage_provider text default 'supabase',
  storage_bucket text,
  storage_path text not null,
  public_url text not null,
  file_size bigint,
  mime_type text,
  width int,
  height int,
  file_name text,
  stage text default 'before',
  caption text,
  description text,
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


create table if not exists geo_posts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  slug text,
  title text,
  summary text,
  service_slug text,
  city text,
  province text,
  neighborhood text,
  lat_public double precision,
  lng_public double precision,
  primary_image_url text,
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
create unique index if not exists geo_posts_project_id_uidx on geo_posts(project_id);
create index if not exists geo_posts_created_at_idx on geo_posts(created_at desc);

create table if not exists instaquote_address_queries (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  neighborhood text,
  service_type text,
  requested_scopes text[],
  place_id text,
  lat numeric(10,7),
  lng numeric(10,7),
  roof_area_sqft integer,
  pitch_degrees numeric(5,1),
  complexity_band text,
  area_source text,
  data_source text,
  estimate_low integer,
  estimate_high integer,
  solar_status text,
  solar_debug jsonb,
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

create table if not exists homepage_metrics (
  id uuid primary key default gen_random_uuid(),
  key_name text unique not null,
  label text not null,
  value_text text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists service_areas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

-- Migration 0011_financial_lifecycle_admin.sql
alter table if exists projects
  add column if not exists quoted_material_cost numeric,
  add column if not exists quoted_subcontractor_cost numeric,
  add column if not exists quoted_labor_cost numeric,
  add column if not exists quoted_equipment_cost numeric,
  add column if not exists quoted_disposal_cost numeric,
  add column if not exists quoted_permit_cost numeric,
  add column if not exists quoted_other_cost numeric,
  add column if not exists quoted_total_cost numeric,
  add column if not exists quoted_sale_price numeric,
  add column if not exists quoted_gross_profit numeric,
  add column if not exists quoted_gross_margin_percent numeric,
  add column if not exists actual_material_cost numeric,
  add column if not exists actual_subcontractor_cost numeric,
  add column if not exists actual_labor_cost numeric,
  add column if not exists actual_equipment_cost numeric,
  add column if not exists actual_disposal_cost numeric,
  add column if not exists actual_permit_cost numeric,
  add column if not exists actual_other_cost numeric,
  add column if not exists actual_total_cost numeric,
  add column if not exists actual_sale_price numeric,
  add column if not exists actual_gross_profit numeric,
  add column if not exists actual_gross_margin_percent numeric;

create table if not exists instant_quotes (
  id uuid primary key default gen_random_uuid(),
  legacy_address_query_id uuid,
  address text not null,
  service_type text,
  quote_low integer,
  quote_high integer,
  has_contact_submission boolean not null default false,
  project_id uuid references projects(id) on delete set null,
  is_marketing boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  instant_quote_id uuid not null references instant_quotes(id) on delete cascade,
  name text,
  email text not null,
  phone text,
  budget_response text,
  timeline text,
  service_type text,
  quote_low integer,
  quote_high integer,
  submitted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table if exists geo_posts
  add column if not exists content text,
  add column if not exists status text not null default 'draft',
  add column if not exists published_at timestamptz,
  add column if not exists gbp_response jsonb;

create table if not exists lead_email_notifications (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  recipient_type text not null check (recipient_type in ('internal', 'customer')),
  recipient_email text not null,
  status text not null check (status in ('sent', 'failed')),
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now(),
  unique (lead_id, recipient_type)
);

create index if not exists instant_quotes_address_idx on instant_quotes(address);
create index if not exists instant_quotes_created_at_idx on instant_quotes(created_at desc);
create index if not exists instant_quotes_project_id_idx on instant_quotes(project_id);
create index if not exists instant_quotes_is_marketing_idx on instant_quotes(is_marketing);
create index if not exists leads_instant_quote_id_idx on leads(instant_quote_id);
create index if not exists leads_created_at_idx on leads(created_at desc);
create index if not exists leads_email_idx on leads(email);
create index if not exists geo_posts_status_idx on geo_posts(status);
create index if not exists lead_email_notifications_lead_id_idx on lead_email_notifications(lead_id);
create index if not exists lead_email_notifications_created_at_idx on lead_email_notifications(created_at desc);
create table if not exists solar_suitability_analyses (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('quote', 'project', 'solar')),
  source_id uuid not null,
  address_snapshot text,
  neighborhood text not null,
  neighborhood_slug text not null,
  city text not null default 'Calgary',
  quadrant text,
  latitude double precision,
  longitude double precision,
  solar_intent boolean not null default false,
  public_activity boolean not null default false,
  usable_roof_area numeric,
  roof_area numeric,
  roof_pitch numeric,
  roof_orientation text,
  shade_score numeric,
  solar_score numeric,
  suitability_summary text,
  raw_solar_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_type, source_id)
);

create index if not exists solar_suitability_neighborhood_slug_idx on solar_suitability_analyses(neighborhood_slug);
create index if not exists solar_suitability_source_idx on solar_suitability_analyses(source_type, source_id);
create index if not exists solar_suitability_public_intent_idx on solar_suitability_analyses(solar_intent, public_activity, created_at desc);
