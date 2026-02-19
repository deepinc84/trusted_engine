alter table if exists projects
  add column if not exists address_private text,
  add column if not exists place_id text,
  add column if not exists geocode_source text;

alter table if exists project_photos
  add column if not exists is_primary boolean default false,
  add column if not exists address_private text,
  add column if not exists lat_private double precision,
  add column if not exists lng_private double precision,
  add column if not exists lat_public double precision,
  add column if not exists lng_public double precision,
  add column if not exists geocode_source text,
  add column if not exists blurhash text;
