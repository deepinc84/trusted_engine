alter table if exists project_photos
  add column if not exists file_name text,
  add column if not exists stage text,
  add column if not exists description text;

update project_photos
set file_name = coalesce(file_name, nullif(regexp_replace(storage_path, '^.*/', ''), ''))
where file_name is null;

update project_photos
set stage = case
  when storage_path ilike '%/after/%' then 'after'
  else 'before'
end
where stage is null;

alter table if exists project_photos
  alter column stage set default 'before';
