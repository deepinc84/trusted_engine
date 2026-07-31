-- Estimator-led workflow metadata. Estimates remain the job aggregate root.
alter table public.estimates add column if not exists assigned_estimator text;
alter table public.estimates add column if not exists workflow_status text not null default 'draft' check (workflow_status in ('draft','needs_pricing','ready_for_proposal','proposal_draft','sent','viewed','accepted','expired','archived'));
alter table public.estimates add column if not exists archived boolean not null default false;
alter table public.estimates add column if not exists preferred_proposal_id uuid references public.proposals(id) on delete set null;
alter table public.estimates add column if not exists ui_completion_state jsonb not null default '{}'::jsonb check (jsonb_typeof(ui_completion_state)='object');
create index if not exists estimates_workflow_status_updated_idx on public.estimates(workflow_status,updated_at desc) where archived=false;
create index if not exists estimates_assigned_estimator_idx on public.estimates(assigned_estimator) where archived=false;
