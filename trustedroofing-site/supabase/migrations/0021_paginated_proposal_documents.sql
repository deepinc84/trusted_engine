alter table proposal_documents
  add column if not exists document_type text not null default 'draft' check(document_type in('draft','sent','signed')),
  add column if not exists status text not null default 'completed' check(status in('started','completed','failed')),
  add column if not exists page_count integer,
  add column if not exists renderer_version text,
  add column if not exists document_hash text,
  add column if not exists generation_error text,
  add column if not exists generated_at timestamptz not null default now();
create unique index if not exists proposal_documents_revision_type_uidx on proposal_documents(proposal_id,revision_number,document_type);
alter table proposal_events drop constraint if exists proposal_events_event_type_check;
alter table proposal_events add constraint proposal_events_event_type_check check(event_type in('sent','send_failed','opened','option_selected','signing_started','accepted','acceptance_failed','signed_pdf_generated','customer_confirmation_sent','internal_notification_sent','token_expired','token_revoked','pdf_generation_started','pdf_generation_completed','pdf_generation_failed','signed_pdf_generation_started','signed_pdf_generation_completed','signed_pdf_generation_failed'));
