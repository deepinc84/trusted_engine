# Analytics, attribution, consent, and QA

## Audit and event inventory

Before this change the root layout loaded GA4 (`G-D895RE5E8H`) with default configuration. GA therefore emitted its initial `page_view`, while Enhanced Measurement could emit `first_visit`, `session_start`, `form_start`, `scroll`, `click`, and `file_download` depending on the GA data-stream settings. Those are Google-managed events, not repository calls. The App Router did not explicitly guarantee subsequent SPA page views.

`QuoteFlow` directly emitted `roof_rejuvenation_quote_viewed` whenever **any roofing estimate** rendered, using the rejuvenation option price even for a replacement quote. It emitted `roof_rejuvenation_selected` on selection, `roof_rejuvenation_lead_submitted` only for that service, and the Google Ads event `ads_conversion_Request_quote_1` after a successful lead API response. The first event was misleading. All three used only numeric value/currency and did not send PII. The attribution tracker separately recorded a capped local journey (`landing`, categorized page views, estimator/address/estimate/contact/PDF stages) and quote APIs copied it into quote records. It was not a general event database.

The misleading service-specific GA events are retired in favor of `generate_quote`, `generate_lead`, and `view_service`. The Ads conversion is preserved. Enhanced Measurement `form_start`, outbound `click`, scroll, and `file_download` remain owned by GA and are deliberately not duplicated. GA config now suppresses its automatic initial page view; one consent-gated `page_view` is sent by the route-aware manager for initial and App Router navigation.

## Event contract

| Event | Exact trigger | GA4 / first-party parameters |
|---|---|---|
| `page_view` | initial route after analytics consent and every changed App Router pathname | `page_path`, `page_title`, `previous_page_path`, `landing_page`, `timestamp`; anonymous IDs exist **only** in the first-party row |
| `start_quote` | valid quote form submission begins, immediately before the estimate request | `service`, `page_path`, `cta_location` |
| `generate_quote` | estimate endpoint returns a successful estimate | `service`, range as `estimate_low`, `estimate_high`, `estimate_midpoint`, `value`, `currency=CAD`, `quote_status`, `contact_submitted`, page/attribution context |
| `generate_lead` | save-lead endpoint returns success | `service`, range midpoint/value, `currency=CAD`, `quote_status`, page/attribution context |
| `form_submit` | that same successful instant-quote contact response | `service`, `page_path`, `form_type`; it is not emitted on validation/API failure |
| `click_call` / `click_email` | delegated click on any public `tel:` / `mailto:` anchor | page/attribution context and semantic `link_location`; never the number/address |
| `click_get_quote` | delegated click on a marked or quote/estimate-labelled anchor | page/attribution context, `cta_location`, path-only `destination` |
| `quote_pdf_downloaded` | quote PDF response succeeds and browser download is initiated | `service`, `page_path` |
| `view_service` | visitor selects the roof-rejuvenation option in quote results | `service`, `page_path` |
| `ads_conversion_Request_quote_1` | preserved legacy Ads conversion after successful lead save | callback/timeout only |

All events gain safe `landing_page`, `source`, `medium`, and `campaign` context when available. A 1.5-second client dedupe window plus route keys protects against Strict Mode and rapid duplicate handlers; server `event_id` uniqueness protects retries.

## Identity, attribution, privacy, and retention

Anonymous UUIDs are stored as first-party `trusted_visitor_id` (365 days) and `trusted_session_id` (30 minutes). They are `SameSite=Lax`, `Secure` on HTTPS, contain no PII, and also have resilient local-storage snapshots. Session activity refreshes the 30-minute window; inactivity rotates the session while retaining the visitor. If cookies/storage fail, quote and site functionality continue and analytics storage safely no-ops. IDs are **not sent to GA4** and are not configured as GA `user_id`.

First touch is immutable. A new session records latest/session touch without replacing it. Captured fields are landing/referrer/referring domain, UTM source/medium/campaign/term/content, `gclid`, `gbclid`/`gbraid`/`wbraid`, `dclid`, `msclkid`, `fbclid`, source category, timestamps, current path, visit count, and ordered journey. Tracking values are removed from stored page paths. Exact organic query is retained only if a search engine actually exposes it; Google commonly does not. Search Console remains the authoritative **aggregate** query source, joinable by date, landing page, country, and device. Such a join must never be labelled visitor-level fact or inferred as a person's query.

The consent banner defaults all Consent Mode v2 signals (`analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization`) to denied. Analytics and ads are separate choices; ads are never pre-granted. Anonymous attribution needed to connect an estimate/lead remains functional first-party storage, while general GA and first-party event transmission occurs only with analytics consent. The raw first-party event endpoint allowlists event names/types and blocks PII-like keys a second time. Contact data stays in existing lead tables. `leads` and `instant_quotes` receive only `analytics_visitor_id` / `analytics_session_id`, allowing pre-conversion page/event history to be queried without copying PII into `analytics_events`.

Migration `0034_deep_analytics.sql` adds `analytics_visitors` (immutable first-touch), `analytics_sessions` (session/latest touch), and ordered `analytics_events` JSON parameters, with RLS, foreign keys, and time indexes. Search Console aggregate exports can later be modelled separately at date/page/country/device/query grain.

## GA4 setup

Mark only `generate_quote`, `generate_lead`, and `click_call` as **Key events**. Register event-scoped custom dimensions: `service`, `city`, `quote_status`, `contact_submitted`, `cta_location`, `link_location`, and `landing_page`. Do not register `source`, `medium`, `campaign`, page path/title, currency, or value because GA4 supplies native acquisition/page/e-commerce fields. Register event-scoped custom metrics `estimate_low`, `estimate_high`, and `estimate_midpoint` with currency units.

## Realtime / DebugView QA

Use a development build (helpers add `debug_mode`) or Tag Assistant, accept Analytics, then inspect GA4 **Admin > DebugView** and **Reports > Realtime**. Verify: fresh/private visit; direct visit; `?utm_source=qa&utm_medium=test&utm_campaign=analytics`; navigation home → quote; successful start/estimate; quote-only exit; contact success; quote then lead; header/footer/content phone and email clicks; PDF; refresh; SPA back/forward; and a return after clearing only the session key/cookie or 30 minutes. Each success should appear once and should contain no contact/address values.

In Supabase verify ordered rows with:

```sql
select event_name,event_timestamp,page_path,event_params from analytics_events where session_id = '<anonymous-session-id>' order by event_timestamp;
select * from analytics_sessions where session_id = '<anonymous-session-id>';
select id,analytics_visitor_id,analytics_session_id from leads where analytics_session_id = '<anonymous-session-id>';
```

Decline optional cookies and confirm GA/network event requests and `/api/analytics/events` stop. Accept analytics but not ads and confirm the four consent signals split correctly. Enhanced Measurement configuration itself is controlled in the GA4 data stream; confirm Forms, Scrolls, Outbound clicks, and File downloads there rather than adding duplicate custom listeners.
