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
