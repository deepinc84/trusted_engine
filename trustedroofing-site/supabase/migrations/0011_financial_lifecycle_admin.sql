-- Financial + lifecycle tracking expansion for admin workflows.

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
  legacy_address_query_id uuid references instaquote_address_queries(id) on delete set null,
  address text not null,
  service_type text,
  quote_low integer,
  quote_high integer,
  has_contact_submission boolean not null default false,
  project_id uuid references projects(id) on delete set null,
  is_marketing boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists instant_quotes_address_idx on instant_quotes(address);
create index if not exists instant_quotes_created_at_idx on instant_quotes(created_at desc);
create index if not exists instant_quotes_project_id_idx on instant_quotes(project_id);
create index if not exists instant_quotes_is_marketing_idx on instant_quotes(is_marketing);

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

create index if not exists leads_instant_quote_id_idx on leads(instant_quote_id);
create index if not exists leads_created_at_idx on leads(created_at desc);
create index if not exists leads_email_idx on leads(email);

alter table if exists geo_posts
  add column if not exists content text,
  add column if not exists status text not null default 'draft',
  add column if not exists published_at timestamptz,
  add column if not exists gbp_response jsonb;

create index if not exists geo_posts_status_idx on geo_posts(status);

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

create index if not exists lead_email_notifications_lead_id_idx on lead_email_notifications(lead_id);
create index if not exists lead_email_notifications_created_at_idx on lead_email_notifications(created_at desc);
