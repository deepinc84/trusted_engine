-- Instant quote records can be created from repaired or historical quote submissions
-- where the legacy instaquote_address_queries row is unavailable. Keep the UUID for
-- lookup/admin matching, but do not block lead capture on the legacy table.
alter table if exists instant_quotes
  drop constraint if exists instant_quotes_legacy_address_query_id_fkey;
