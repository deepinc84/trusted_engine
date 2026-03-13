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

create unique index if not exists geo_posts_project_id_uidx on geo_posts(project_id);
create index if not exists geo_posts_created_at_idx on geo_posts(created_at desc);
