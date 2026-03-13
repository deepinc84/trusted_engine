alter table if exists project_photos
  add column if not exists storage_provider text,
  add column if not exists storage_bucket text,
  add column if not exists file_size bigint,
  add column if not exists mime_type text,
  add column if not exists width int,
  add column if not exists height int;

update project_photos
set storage_provider = coalesce(storage_provider, 'supabase')
where storage_provider is null;

alter table if exists project_photos
  alter column storage_provider set default 'supabase';
