alter table if exists instaquote_address_queries
  add column if not exists solar_status text,
  add column if not exists solar_debug jsonb;
