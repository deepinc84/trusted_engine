-- Nullable, backward-compatible first-party attribution. Historical rows remain valid.
alter table if exists quote_events
  add column if not exists visitor_id text, add column if not exists session_id text,
  add column if not exists first_seen_at timestamptz, add column if not exists session_started_at timestamptz, add column if not exists quote_generated_at timestamptz,
  add column if not exists is_returning_visitor boolean, add column if not exists previous_visit_count integer,
  add column if not exists first_source_category text, add column if not exists last_source_category text,
  add column if not exists attribution jsonb, add column if not exists journey jsonb,
  add column if not exists quote_history jsonb;
alter table if exists instant_quotes
  add column if not exists visitor_id text, add column if not exists session_id text,
  add column if not exists first_seen_at timestamptz, add column if not exists session_started_at timestamptz, add column if not exists quote_generated_at timestamptz,
  add column if not exists is_returning_visitor boolean, add column if not exists previous_visit_count integer,
  add column if not exists first_source_category text, add column if not exists last_source_category text,
  add column if not exists attribution jsonb, add column if not exists journey jsonb,
  add column if not exists quote_history jsonb;
create index if not exists instant_quotes_visitor_created_idx on instant_quotes(visitor_id, created_at desc) where visitor_id is not null;
create index if not exists quote_events_visitor_created_idx on quote_events(visitor_id, created_at desc) where visitor_id is not null;
notify pgrst, 'reload schema';
