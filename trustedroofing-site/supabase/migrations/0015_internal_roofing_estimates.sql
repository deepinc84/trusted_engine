-- Internal roofing estimate foundation. Admin requests reach these tables only through service-role server routes.
create table if not exists estimate_customers (
  id uuid primary key default gen_random_uuid(), first_name text not null, last_name text not null,
  email text, phone text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists estimate_properties (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references estimate_customers(id) on delete cascade,
  address_line1 text not null, address_line2 text, city text not null default 'Calgary', province text not null default 'AB',
  postal_code text, place_id text, latitude numeric, longitude numeric, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists estimates (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references estimate_customers(id),
  property_id uuid not null references estimate_properties(id), scope text not null default 'roofing' check (scope = 'roofing'),
  status text not null default 'draft' check (status in ('draft','archived')), created_by text not null, updated_by text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists roofing_measurements (
  estimate_id uuid primary key references estimates(id) on delete cascade, roof_area_sqft numeric not null default 0, squares numeric not null default 0,
  pitch text not null default '4/12', complexity text not null default 'moderate' check (complexity in ('simple','moderate','complex')),
  existing_layers integer not null default 1, eaves numeric not null default 0, rakes numeric not null default 0, valleys numeric not null default 0,
  hips numeric not null default 0, ridges numeric not null default 0, wall_transitions numeric not null default 0,
  plumbing_vents integer not null default 0, goosenecks integer not null default 0, static_vents integer not null default 0,
  stories integer not null default 1, decking_allowance numeric not null default 0,
  access_difficulty text not null default 'standard' check (access_difficulty in ('standard','restricted','difficult')),
  internal_notes text not null default '', updated_at timestamptz not null default now()
);
create table if not exists estimate_system_snapshots (
  id uuid primary key default gen_random_uuid(), estimate_id uuid not null references estimates(id) on delete cascade,
  tier text not null check (tier in ('good','better','best')), configuration jsonb not null, created_at timestamptz not null default now(),
  unique (estimate_id, tier)
);
create table if not exists estimate_option_results (
  id uuid primary key default gen_random_uuid(), estimate_id uuid not null references estimates(id) on delete cascade,
  system_snapshot_id uuid not null references estimate_system_snapshots(id) on delete cascade, tier text not null,
  breakdown jsonb not null, calculated_price numeric not null, final_price numeric not null, calculated_at timestamptz not null default now(),
  unique (estimate_id, tier)
);
create table if not exists estimate_manual_overrides (
  id uuid primary key default gen_random_uuid(), estimate_id uuid not null references estimates(id) on delete cascade,
  option_result_id uuid not null references estimate_option_results(id) on delete cascade, original_calculated_value numeric not null,
  new_value numeric not null, reason text not null check (length(trim(reason)) > 0), overridden_by text not null, created_at timestamptz not null default now()
);
create index if not exists estimates_updated_at_idx on estimates(updated_at desc);
create index if not exists estimate_properties_customer_idx on estimate_properties(customer_id);
create index if not exists estimate_overrides_estimate_idx on estimate_manual_overrides(estimate_id, created_at desc);

alter table estimate_customers enable row level security;
alter table estimate_properties enable row level security;
alter table estimates enable row level security;
alter table roofing_measurements enable row level security;
alter table estimate_system_snapshots enable row level security;
alter table estimate_option_results enable row level security;
alter table estimate_manual_overrides enable row level security;
do $$ declare t text; begin
  foreach t in array array['estimate_customers','estimate_properties','estimates','roofing_measurements','estimate_system_snapshots','estimate_option_results','estimate_manual_overrides'] loop
    execute format('drop policy if exists "internal estimates are service role only" on %I', t);
    execute format('create policy "internal estimates are service role only" on %I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')', t);
  end loop;
end $$;
