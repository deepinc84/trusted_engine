# Instant quote attribution audit (2026-08-12)

## Existing tracking discovered before implementation

- GA4 measurement ID `G-D895RE5E8H` was loaded in the root layout and quote lead conversions used `gtag`. Quote generation remains independent of GA/ad blockers.
- `trusted_quote_source` localStorage captured one landing/referrer/UTM set only when `QuoteFlow` mounted. There was no visitor ID, session ID, returning logic, click IDs, journey, or direct-return last touch.
- `quote_events` and `instant_quotes` already had source, landing, referrer, UTM, first/current path, device/UA, PDF, and notification columns. The estimate and lead APIs propagated this metadata; lead raw JSON was also available.
- Supabase persisted address queries, quote events, lifecycle instant quotes/leads, PDF state, and idempotent email state. Admin already displayed basic source fields. Emails already escaped row values.
- GA identifiers were not persisted. No general analytics-consent control or cookie banner was found; this implementation therefore uses first-party functional local/session storage only and does not add or alter GA consent behavior.

## Gaps and minimal implementation

The old data could not preserve first versus last touch, recognize a browser/session, correlate quotes, or reconstruct a journey. The minimal implementation reuses quote metadata and existing tables: one centralized classifier, a root route tracker, JSON snapshots plus queryable IDs/categories, server-side same-address correlation, and compact email/admin rows. It adds no fingerprint, IP identity, new personal fields, GA dependency, or new dashboard.

## Manual setup and limits

- Apply `0031_quote_attribution.sql` to Supabase before deployment.
- Apply `0032_quote_telemetry_diagnostics.sql` and configure `QUOTE_TELEMETRY_HMAC_SECRET` with a long random server-only value. The request IP is normalized in memory and HMAC-SHA256 hashed with its UTC date; only the daily rotating hash is stored.
- Configure the Google Business Profile website link as `https://www.trustedexteriors.ca/?utm_source=google&utm_medium=organic&utm_campaign=gbp` (use the production canonical hostname). Only this explicit campaign is classified as GBP.
- No GA4 changes are required beyond the server-only telemetry secret above. GA client/session IDs are deliberately not read because consent-mode support was not present; they can be added later only with appropriate consent.
- Storage is browser-local: clearing/blocking storage, private browsing, another browser/device, and server-side visits prevent continuity. Same-address matching uses the geocoded address string and may miss formatting changes. Exact organic search keywords are neither available nor inferred.

## Ranchlands missing-metadata root cause (2026-08-22)

The root tracker initialized in a React effect while `QuoteFlow` independently read its global API in another effect. That ordering was not guaranteed, and the quote payload serialized `null` whenever the global was not ready or storage threw. The normalizer then returned an empty object. In addition, deployment without migration 0031 triggered a compatibility retry that deliberately removed all attribution columns, so a quote could succeed but lose otherwise valid metadata. Legacy email/admin rendering converted nullable returning/history state into `No` and `0`, hiding the distinction between missing telemetry and a confirmed first visit.

Initialization is now synchronous on every payload read, uses a persistent first-party visitor UUID and a localStorage session record renewed after 30 minutes of inactivity, and still returns `null` without interrupting quote generation when storage is unavailable. Migration compatibility remains intentionally fail-open; operators must apply both migrations to persist the new columns.
