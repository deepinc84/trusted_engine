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

insert into homepage_metrics (key_name, label, value_text, sort_order, is_active)
values
  ('homes_served', 'Calgary homes served', '500+', 1, true),
  ('avg_quote_turnaround', 'Average estimate turnaround', '48hr', 2, true),
  ('workmanship_warranty', 'Workmanship warranty', '10yr', 3, true),
  ('financing_label', 'Financing available', '100%', 4, true),
  ('insurance_status', 'Insured & licensed', 'A+', 5, true)
on conflict (key_name) do nothing;

insert into service_areas (name, slug, active, sort_order)
values
  ('Mahogany', 'mahogany', true, 1),
  ('Auburn Bay', 'auburn-bay', true, 2),
  ('Cranston', 'cranston', true, 3),
  ('Seton', 'seton', true, 4),
  ('Altadore', 'altadore', true, 5),
  ('Marda Loop', 'marda-loop', true, 6),
  ('Evergreen', 'evergreen', true, 7),
  ('Legacy', 'legacy', true, 8)
on conflict (slug) do nothing;
