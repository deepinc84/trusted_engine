alter table if exists quote_events
  add column if not exists source_type text,
  add column if not exists landing_page text,
  add column if not exists referrer text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_term text,
  add column if not exists utm_content text,
  add column if not exists first_page_path text,
  add column if not exists current_page_path text,
  add column if not exists device_category text,
  add column if not exists user_agent_summary text,
  add column if not exists pdf_available boolean not null default false,
  add column if not exists pdf_generated_at timestamptz,
  add column if not exists pdf_downloaded_at timestamptz,
  add column if not exists pdf_download_count integer not null default 0,
  add column if not exists last_pdf_downloaded_at timestamptz,
  add column if not exists quote_event_notified_at timestamptz,
  add column if not exists lead_notification_sent_at timestamptz,
  add column if not exists pdf_download_notification_sent_at timestamptz,
  add column if not exists marketing_tagged_at timestamptz,
  add column if not exists marketing_tagged_by text;

alter table if exists instant_quotes
  add column if not exists source_type text,
  add column if not exists landing_page text,
  add column if not exists referrer text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_term text,
  add column if not exists utm_content text,
  add column if not exists first_page_path text,
  add column if not exists current_page_path text,
  add column if not exists device_category text,
  add column if not exists user_agent_summary text,
  add column if not exists pdf_available boolean not null default false,
  add column if not exists pdf_generated_at timestamptz,
  add column if not exists pdf_downloaded_at timestamptz,
  add column if not exists pdf_download_count integer not null default 0,
  add column if not exists last_pdf_downloaded_at timestamptz,
  add column if not exists quote_event_notified_at timestamptz,
  add column if not exists lead_notification_sent_at timestamptz,
  add column if not exists pdf_download_notification_sent_at timestamptz,
  add column if not exists marketing_tagged_at timestamptz,
  add column if not exists marketing_tagged_by text;

create index if not exists quote_events_source_type_idx on quote_events(source_type);
create index if not exists quote_events_pdf_downloaded_at_idx on quote_events(pdf_downloaded_at desc);
create index if not exists instant_quotes_source_type_idx on instant_quotes(source_type);
create index if not exists instant_quotes_pdf_downloaded_at_idx on instant_quotes(pdf_downloaded_at desc);
