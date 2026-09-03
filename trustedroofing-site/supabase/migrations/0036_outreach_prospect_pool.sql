-- Expand outreach_prospects into a discovery pool.
-- Companies can be stored before an email address or CASL basis has been verified.

alter table outreach_prospects
  alter column email drop not null;

alter table outreach_prospects
  add column if not exists verification_status text not null default 'needs_email'
    check (verification_status in ('needs_email','needs_source_review','verified_for_outreach','do_not_contact')),
  add column if not exists rank_order integer,
  add column if not exists market_tier integer check (market_tier between 1 and 4);

create index if not exists outreach_prospects_rank_order_idx
  on outreach_prospects(rank_order nulls last, created_at);

create index if not exists outreach_prospects_verification_status_idx
  on outreach_prospects(verification_status, market_tier, priority);

-- The CRCA directory expressly says its published email addresses are not consent
-- to receive commercial electronic messages. Keep these companies in the research
-- pool, but do not treat CRCA-only contact data as verified outreach consent.
update outreach_prospects
set consent_basis = 'association_directory_no_consent',
    consent_verified_at = null,
    verification_status = 'needs_source_review',
    updated_at = now()
where source_url ilike '%CRCA%'
   or notes ilike '%CRCA%';
