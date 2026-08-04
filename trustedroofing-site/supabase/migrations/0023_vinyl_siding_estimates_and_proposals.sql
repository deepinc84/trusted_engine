-- Additive, backward-compatible multi-trade and vinyl-siding snapshots.
alter table estimates add column if not exists selected_scopes text[] not null default '{}';
update estimates set selected_scopes=case scope when 'roofing' then array['roofing'] when 'soft_metals' then array['soft_metals'] when 'combined' then array['roofing','soft_metals'] else array[scope] end where cardinality(selected_scopes)=0;
alter table estimates drop constraint if exists estimates_scope_check;
alter table estimates add constraint estimates_scope_check check(scope in('roofing','soft_metals','vinyl_siding','combined','multi_trade'));
alter table estimates add constraint estimates_selected_scopes_check check(selected_scopes <@ array['roofing','soft_metals','vinyl_siding','hardie_siding','custom']::text[] and cardinality(selected_scopes)>0);
alter table estimate_scopes drop constraint if exists estimate_scopes_scope_type_check;
alter table estimate_scopes add constraint estimate_scopes_scope_type_check check(scope_type in('eavestrough','downspouts','fascia','soffit','vinyl_siding'));
alter table proposals add column if not exists selected_scopes text[] not null default '{}';
alter table proposals add column if not exists vinyl_scopes_snapshot jsonb not null default '[]' check(jsonb_typeof(vinyl_scopes_snapshot)='array');
alter table proposal_acceptances add column if not exists vinyl_selection_snapshot jsonb not null default '{}' check(jsonb_typeof(vinyl_selection_snapshot)='object');
create index if not exists estimates_selected_scopes_gin_idx on estimates using gin(selected_scopes);
create index if not exists estimate_scopes_vinyl_idx on estimate_scopes(estimate_id) where scope_type='vinyl_siding';
comment on column proposals.vinyl_scopes_snapshot is 'Immutable customer-safe vinyl scope data copied into each locked proposal revision.';
