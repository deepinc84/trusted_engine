-- Nullable, server-only correlation diagnostics. Raw IP addresses are never stored.
alter table if exists quote_events
  add column if not exists daily_ip_hash text,
  add column if not exists telemetry_status text,
  add column if not exists likely_automation boolean;
alter table if exists instant_quotes
  add column if not exists daily_ip_hash text,
  add column if not exists telemetry_status text,
  add column if not exists likely_automation boolean,
  add column if not exists same_anonymous_network_today boolean;
create index if not exists instant_quotes_daily_ip_created_idx on instant_quotes(daily_ip_hash, created_at desc) where daily_ip_hash is not null;
