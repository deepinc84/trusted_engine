-- One current quote per normalized property address and quote type.
-- Keep the newest row, preserve its identity for downstream leads, and update
-- that row in place whenever the customer prices the same scope again.
alter table if exists instaquote_address_queries
  add column if not exists address_key text generated always as
    (lower(regexp_replace(btrim(address), '[[:space:]]+', ' ', 'g'))) stored;

alter table if exists instant_quotes
  add column if not exists address_key text generated always as
    (lower(regexp_replace(btrim(address), '[[:space:]]+', ' ', 'g'))) stored;

with ranked as (
  select id,
         first_value(id) over (
           partition by address_key, coalesce(service_type, '')
           order by created_at desc, id desc
         ) as keeper_id,
         row_number() over (
           partition by address_key, coalesce(service_type, '')
           order by created_at desc, id desc
         ) as duplicate_rank
  from instant_quotes
), duplicates as (
  select id, keeper_id from ranked where duplicate_rank > 1
)
update leads
set instant_quote_id = duplicates.keeper_id
from duplicates
where leads.instant_quote_id = duplicates.id;

delete from instant_quotes
using (
  select id from (
    select id, row_number() over (
      partition by address_key, coalesce(service_type, '')
      order by created_at desc, id desc
    ) as duplicate_rank
    from instant_quotes
  ) ranked where duplicate_rank > 1
) duplicates
where instant_quotes.id = duplicates.id;

with ranked as (
  select id,
         first_value(id) over (
           partition by address_key, coalesce(service_type, '')
           order by queried_at desc, id desc
         ) as keeper_id,
         row_number() over (
           partition by address_key, coalesce(service_type, '')
           order by queried_at desc, id desc
         ) as duplicate_rank
  from instaquote_address_queries
), duplicates as (
  select id, keeper_id from ranked where duplicate_rank > 1
)
update instaquote_leads
set address_query_id = duplicates.keeper_id
from duplicates
where instaquote_leads.address_query_id = duplicates.id;

with ranked as (
  select id,
         first_value(id) over (
           partition by address_key, coalesce(service_type, '')
           order by queried_at desc, id desc
         ) as keeper_id,
         row_number() over (
           partition by address_key, coalesce(service_type, '')
           order by queried_at desc, id desc
         ) as duplicate_rank
  from instaquote_address_queries
), duplicates as (
  select id, keeper_id from ranked where duplicate_rank > 1
)
update instant_quotes
set legacy_address_query_id = duplicates.keeper_id
from duplicates
where instant_quotes.legacy_address_query_id = duplicates.id;

-- The public activity feed reads quote_events. Remove its superseded event as
-- well so an old duplicate cannot remain visible after this cleanup.
delete from quote_events
using (
  select id from (
    select id, row_number() over (
      partition by address_key, coalesce(service_type, '')
      order by queried_at desc, id desc
    ) as duplicate_rank
    from instaquote_address_queries
  ) ranked where duplicate_rank > 1
) duplicates
where quote_events.id = duplicates.id;

delete from instaquote_address_queries
using (
  select id from (
    select id, row_number() over (
      partition by address_key, coalesce(service_type, '')
      order by queried_at desc, id desc
    ) as duplicate_rank
    from instaquote_address_queries
  ) ranked where duplicate_rank > 1
) duplicates
where instaquote_address_queries.id = duplicates.id;

create unique index if not exists instant_quotes_address_service_unique
  on instant_quotes(address_key, coalesce(service_type, ''));
create unique index if not exists instaquote_queries_address_service_unique
  on instaquote_address_queries(address_key, coalesce(service_type, ''));
