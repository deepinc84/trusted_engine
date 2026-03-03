create extension if not exists pgcrypto;

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
