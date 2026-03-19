-- Backfill legacy projects.images (text[]) into normalized project_photos rows.
-- Safe to run repeatedly.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'projects'
      and column_name = 'images'
  ) then
    insert into public.project_photos (
      project_id,
      storage_provider,
      storage_bucket,
      storage_path,
      public_url,
      caption,
      sort_order,
      is_primary,
      created_at
    )
    select
      p.id as project_id,
      'supabase'::text as storage_provider,
      null::text as storage_bucket,
      img.url as storage_path,
      img.url as public_url,
      null::text as caption,
      greatest(img.ord::int - 1, 0) as sort_order,
      (img.ord = 1) as is_primary,
      now() as created_at
    from public.projects p
    cross join lateral unnest(p.images) with ordinality as img(url, ord)
    where coalesce(array_length(p.images, 1), 0) > 0
      and not exists (
        select 1
        from public.project_photos pp
        where pp.project_id = p.id
      );
  end if;
end $$;
