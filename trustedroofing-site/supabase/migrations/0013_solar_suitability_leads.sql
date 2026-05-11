create table if not exists solar_suitability_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  address_snapshot text not null,
  city text,
  neighborhood text,
  neighborhood_slug text,
  latitude double precision,
  longitude double precision,
  preferred_date_1 date not null,
  preferred_time_window_1 text not null,
  preferred_date_2 date not null,
  preferred_time_window_2 text not null,
  preferred_date_3 date not null,
  preferred_time_window_3 text not null,
  notes text,
  bill_file_url text,
  bill_file_path text,
  bill_file_mime_type text,
  bill_file_size bigint,
  status text not null default 'new',
  emailed_to text,
  emailed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint solar_suitability_leads_status_check check (status in ('new', 'reviewing', 'contacted', 'closed', 'email_failed')),
  constraint solar_suitability_leads_bill_file_size_check check (bill_file_size is null or bill_file_size <= 10485760),
  constraint solar_suitability_leads_bill_file_mime_check check (
    bill_file_mime_type is null or bill_file_mime_type in (
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/heic',
      'image/heif',
      'image/webp'
    )
  )
);

create index if not exists solar_suitability_leads_created_at_idx on solar_suitability_leads(created_at desc);
create index if not exists solar_suitability_leads_status_idx on solar_suitability_leads(status);

create or replace function update_solar_suitability_leads_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists solar_suitability_leads_updated_at on solar_suitability_leads;
create trigger solar_suitability_leads_updated_at
before update on solar_suitability_leads
for each row execute function update_solar_suitability_leads_updated_at();

alter table solar_suitability_leads enable row level security;

drop policy if exists "solar suitability leads are service role only" on solar_suitability_leads;
create policy "solar suitability leads are service role only"
on solar_suitability_leads
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'solar-bills',
  'solar-bills',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/heic',
    'image/heif',
    'image/webp'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
