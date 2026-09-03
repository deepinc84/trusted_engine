create table if not exists outreach_prospects (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  email text not null unique,
  website text,
  metro text,
  province text,
  source_url text,
  consent_basis text not null default 'conspicuously_published',
  consent_verified_at timestamptz,
  website_observation text,
  status text not null default 'verified' check (status in ('discovered','verified','qualified','enrolled','contacted','replied','interested','meeting','proposal','won','lost','suppressed')),
  priority text not null default 'B' check (priority in ('A','B','C','D')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists outreach_prospects_email_lower_idx on outreach_prospects(lower(email));

create table if not exists outreach_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean not null default false,
  daily_new_prospect_limit integer not null default 15 check (daily_new_prospect_limit between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists outreach_campaign_steps (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references outreach_campaigns(id) on delete cascade,
  step_number integer not null,
  delay_days integer not null default 0,
  subject_template text not null,
  text_template text not null,
  html_template text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(campaign_id, step_number)
);

create table if not exists outreach_enrollments (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references outreach_campaigns(id) on delete cascade,
  prospect_id uuid not null references outreach_prospects(id) on delete cascade,
  current_step integer not null default 1,
  next_send_at timestamptz,
  state text not null default 'active' check (state in ('active','paused','completed','replied','unsubscribed','bounced','won','lost')),
  enrolled_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(campaign_id, prospect_id)
);
create index if not exists outreach_enrollments_due_idx on outreach_enrollments(state, next_send_at);

create table if not exists outreach_suppressions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  reason text not null,
  source text not null default 'unsubscribe',
  created_at timestamptz not null default now()
);
create index if not exists outreach_suppressions_email_lower_idx on outreach_suppressions(lower(email));

create table if not exists outreach_messages (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid references outreach_enrollments(id) on delete set null,
  prospect_id uuid not null references outreach_prospects(id) on delete cascade,
  campaign_step_id uuid references outreach_campaign_steps(id) on delete set null,
  direction text not null default 'outbound' check (direction in ('outbound','inbound')),
  status text not null default 'queued' check (status in ('queued','sending','sent','failed','bounced','replied')),
  recipient_email text not null,
  subject text,
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists outreach_messages_prospect_idx on outreach_messages(prospect_id, created_at desc);

create table if not exists outreach_unsubscribe_tokens (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null unique references outreach_prospects(id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now()
);

alter table outreach_prospects enable row level security;
alter table outreach_campaigns enable row level security;
alter table outreach_campaign_steps enable row level security;
alter table outreach_enrollments enable row level security;
alter table outreach_suppressions enable row level security;
alter table outreach_messages enable row level security;
alter table outreach_unsubscribe_tokens enable row level security;
