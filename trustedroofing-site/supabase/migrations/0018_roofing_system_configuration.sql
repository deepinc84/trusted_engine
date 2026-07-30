create table if not exists roofing_systems (
  id uuid primary key default gen_random_uuid(), system_key text not null unique, system_name text not null,
  tier text not null check (tier in ('good','better','best','custom')), manufacturer text not null,
  active boolean not null default true, active_version_id uuid, created_by text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists roofing_system_versions (
  id uuid primary key default gen_random_uuid(), roofing_system_id uuid not null references roofing_systems(id) on delete restrict,
  version_number integer not null, catalog_version_id uuid not null references pricing_catalog_versions(id) on delete restrict,
  field_shingle_item_id uuid not null references pricing_catalog_items(id) on delete restrict,
  starter_item_id uuid references pricing_catalog_items(id) on delete restrict, hip_ridge_item_id uuid references pricing_catalog_items(id) on delete restrict,
  ice_water_item_id uuid references pricing_catalog_items(id) on delete restrict, underlayment_item_id uuid references pricing_catalog_items(id) on delete restrict,
  drip_edge_item_id uuid references pricing_catalog_items(id) on delete restrict, rake_edge_item_id uuid references pricing_catalog_items(id) on delete restrict,
  valley_metal_item_id uuid references pricing_catalog_items(id) on delete restrict, attic_vent_item_id uuid references pricing_catalog_items(id) on delete restrict,
  gooseneck_item_id uuid references pricing_catalog_items(id) on delete restrict, plumbing_boot_item_id uuid references pricing_catalog_items(id) on delete restrict,
  waste_factors jsonb not null default '{}', customer_summary text not null, warranty_summary text not null,
  compatibility_confirmed boolean not null default false, compatibility_reason text, production_ready boolean not null default false,
  review_warnings jsonb not null default '[]', pricing_strategy jsonb not null default '{"type":"fixed_profit","value":100}',
  created_by text not null, created_at timestamptz not null default now(), unique(roofing_system_id,version_number)
);
alter table roofing_systems add constraint roofing_systems_active_version_fk foreign key(active_version_id) references roofing_system_versions(id) on delete restrict;
create index if not exists roofing_system_versions_system_idx on roofing_system_versions(roofing_system_id,version_number desc);
create index if not exists roofing_system_versions_catalog_idx on roofing_system_versions(catalog_version_id);
alter table roofing_systems enable row level security; alter table roofing_system_versions enable row level security;
create policy "roofing systems service role only" on roofing_systems for all using(auth.role()='service_role') with check(auth.role()='service_role');
create policy "roofing system versions service role only" on roofing_system_versions for all using(auth.role()='service_role') with check(auth.role()='service_role');
insert into roofing_systems(system_key,system_name,tier,manufacturer,created_by) values
('good','Trusted Good Roofing System','good','GAF','migration'),('better','Trusted Better Roofing System','better','Malarkey','migration'),('best','Trusted Best Roofing System','best','Malarkey','migration') on conflict(system_key) do nothing;
