-- Structured roofing estimates: labelled structures, repeatable pitch areas, explicit rate applicability and audit traces.
create table if not exists public.estimate_roof_structures (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  label text not null default 'Main Structure',
  normalized_label text generated always as (coalesce(nullif(btrim(label), ''), 'Main Structure')) stored,
  inclusion_status text not null default 'included' check (inclusion_status in ('included','optional','alternative','excluded','by_others','internal_only')),
  display_order integer not null default 0,
  measurements jsonb not null default '{}'::jsonb,
  penetrations jsonb not null default '{}'::jsonb,
  ventilation jsonb not null default '{}'::jsonb,
  internal_notes text,
  version integer not null default 1,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists estimate_roof_structures_estimate_idx on public.estimate_roof_structures(estimate_id, display_order);

create table if not exists public.estimate_roof_pitch_areas (
  id uuid primary key default gen_random_uuid(),
  structure_id uuid not null references public.estimate_roof_structures(id) on delete cascade,
  pitch jsonb not null,
  square_footage numeric not null default 0,
  area_entry_type text not null default 'actual_roof_area' check (area_entry_type in ('actual_roof_area','horizontal_plan_area')),
  waste_override numeric,
  note text,
  include_status text not null default 'included' check (include_status in ('included','excluded')),
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists estimate_roof_pitch_areas_structure_idx on public.estimate_roof_pitch_areas(structure_id, display_order);

create table if not exists public.estimate_roof_structure_options (
  id uuid primary key default gen_random_uuid(),
  structure_id uuid not null references public.estimate_roof_structures(id) on delete cascade,
  tier text not null check (tier in ('good','better','best')),
  option_snapshot jsonb not null default '{}'::jsonb,
  calculation_trace jsonb not null default '{}'::jsonb,
  production_ready boolean not null default false,
  warnings jsonb not null default '[]'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(structure_id, tier)
);

create table if not exists public.estimate_roof_rate_applications (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  structure_id uuid references public.estimate_roof_structures(id) on delete cascade,
  tier text not null check (tier in ('good','better','best')),
  rate_item_id uuid,
  rate_classification text not null,
  quantity_source text not null,
  applicability_reason text not null,
  selected_by_estimator boolean not null default false,
  condition_metadata jsonb not null default '{}'::jsonb,
  applied_quantity numeric,
  extension numeric,
  warnings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists estimate_roof_rate_applications_estimate_idx on public.estimate_roof_rate_applications(estimate_id, tier);

alter table public.estimate_roof_structures enable row level security;
alter table public.estimate_roof_pitch_areas enable row level security;
alter table public.estimate_roof_structure_options enable row level security;
alter table public.estimate_roof_rate_applications enable row level security;

create policy "Service role manages roof structures" on public.estimate_roof_structures for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Service role manages roof pitch areas" on public.estimate_roof_pitch_areas for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Service role manages roof structure options" on public.estimate_roof_structure_options for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Service role manages roof rate applications" on public.estimate_roof_rate_applications for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

insert into public.app_schema_migrations(migration_number, migration_name, checksum, applied_by, environment, notes)
values ('0029', 'structured_roofing_estimates', 'manual-check-required', 'deployment', current_setting('app.environment', true), 'Adds labelled roof structures, pitch areas, option traces and explicit rate applications.')
on conflict (migration_number) do nothing;
notify pgrst, 'reload schema';
