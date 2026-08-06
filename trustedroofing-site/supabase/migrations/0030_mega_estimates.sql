create table if not exists mega_estimates (
  id uuid primary key default gen_random_uuid(),
  estimate_number text not null unique default ('EST-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  customer_name text not null default 'Customer not entered',
  property_address text not null default 'Property not entered',
  status text not null default 'draft' check (status in ('draft','proposal_generated','sent','accepted','archived')),
  final_price numeric,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mega_estimates_updated_at_idx on mega_estimates(updated_at desc);
