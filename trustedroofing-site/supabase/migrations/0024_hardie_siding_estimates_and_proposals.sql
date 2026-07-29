-- Additive James Hardie scope support using the existing service-role-only generic scope tables.
alter table estimates drop constraint if exists estimates_scope_check;
alter table estimates add constraint estimates_scope_check check(scope in('roofing','soft_metals','vinyl_siding','hardie_siding','combined','multi_trade'));
alter table estimates drop constraint if exists estimates_selected_scopes_check;
alter table estimates add constraint estimates_selected_scopes_check check(selected_scopes <@ array['roofing','soft_metals','vinyl_siding','hardie_siding','custom']::text[] and cardinality(selected_scopes)>0);
alter table estimate_scopes drop constraint if exists estimate_scopes_scope_type_check;
alter table estimate_scopes add constraint estimate_scopes_scope_type_check check(scope_type in('eavestrough','downspouts','fascia','soffit','vinyl_siding','hardie_siding'));
alter table proposals add column if not exists hardie_scopes_snapshot jsonb not null default '[]' check(jsonb_typeof(hardie_scopes_snapshot)='array');
alter table proposal_acceptances add column if not exists hardie_selection_snapshot jsonb not null default '{}' check(jsonb_typeof(hardie_selection_snapshot)='object');
create index if not exists estimate_scopes_hardie_idx on estimate_scopes(estimate_id) where scope_type='hardie_siding';
comment on column proposals.hardie_scopes_snapshot is 'Immutable customer-safe James Hardie scope data copied into each locked proposal revision.';
comment on column proposal_acceptances.hardie_selection_snapshot is 'Accepted Hardie assembly, elevation, finish, colour, rainscreen and insulation selections.';
-- Existing RLS policies on estimates, estimate_scopes, proposals and acceptances remain service-role only.
