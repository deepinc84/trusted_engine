alter table if exists instaquote_address_queries
  add column if not exists service_type text,
  add column if not exists requested_scopes text[];
