alter table if exists instaquote_address_queries
  add column if not exists estimate_low integer,
  add column if not exists estimate_high integer;
