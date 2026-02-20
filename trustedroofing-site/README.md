# Trusted Roofing & Exteriors (Next.js App)

GeoBoost-ready marketing site + private admin publishing app for trustedroofingcalgary.com.

## Stack

- Next.js App Router + TypeScript
- Supabase Postgres + Supabase Storage
- Vercel deployment

## Environment variables

Copy `.env.example` to `.env.local` and set values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only, required for admin writes/uploads/GBP queue worker)
- `NEXT_PUBLIC_GOOGLE_PLACES_KEY` (client key for address autocomplete widgets, if enabled)
- `GOOGLE_SECRET_KEY` (server-only key for `/api/geocode` Google Geocoding calls)
- `ADMIN_TOKEN` (middleware token gate for `/admin`)
- `GBP_WORKER_TOKEN` (protects `/api/gbp/worker`)
- `INDEXING_TOKEN` (protects internal indexing trigger endpoint `/api/index-project`)
- `GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON` (placeholder for future Google Indexing API wiring)
- `NEXT_PUBLIC_SITE_URL` (optional; canonical defaults are hardcoded to trustedroofingcalgary.com)
- `GOOGLE_SOLAR_API_KEY` (server-only, Solar building insights for InstantQuote)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (client Google Maps script key for future map widgets)

Future GBP placeholders (worker keeps queue pending until configured):

- `GBP_CLIENT_ID`
- `GBP_CLIENT_SECRET`
- `GBP_REFRESH_TOKEN`
- `GBP_LOCATION_ID`

## Database schema

Run SQL from:

- `supabase/schema.sql`

Migration snapshot:

- `supabase/migrations/0001_init.sql`

Tables:

- `services`
- `projects`
- `project_photos`
- `quote_events`
- `quote_contacts`
- `gbp_post_queue`

## Local run

```bash
npm install
npm run dev
```

Open:

- Public site: `http://localhost:3000`
- Admin: `http://localhost:3000/admin?token=<ADMIN_TOKEN>`

## Quick Vercel setup (GeoBoost admin + geocoding)

1. In Vercel project settings, add all variables from `.env.example`.
2. Make sure `ADMIN_TOKEN` is a long random string.
3. Add your existing keys exactly as:
   - `NEXT_PUBLIC_GOOGLE_PLACES_KEY` = browser autocomplete key
   - `GOOGLE_SECRET_KEY` = server geocoding key
4. Redeploy the latest production deployment.
5. Verify health: `https://trustedroofingcalgary.com/api/health`
6. Open admin with token once: `https://trustedroofingcalgary.com/admin?token=<ADMIN_TOKEN>`
   - middleware stores `admin_token` cookie, then `/admin` works directly.

## Admin publishing flow

1. Create/update project in `/admin`
2. Enter the private address and click **Auto-fill lat/lng from address** (uses `/api/geocode`, Google first, Nominatim fallback)
3. Review/correct address + coordinates, then save project
4. Upload multiple photos, preview before upload, and choose a **Main image**
5. Every uploaded photo is stored with project geo metadata (`address_private`, `lat_private/lng_private`, rounded `lat_public/lng_public`)
6. Publish writes to Supabase immediately and enqueues GBP payload in `gbp_post_queue`


## GeoBoost pipeline walkthrough

1. **Service mapping**: every project is linked to a service via `service_slug` in Admin form and persisted on `projects.service_slug`.
2. **Location capture mode**: admin defaults to **Use my current location** (browser geolocation + reverse geocode) with optional manual address mode still available.
3. **Privacy split**: private coords remain in `lat_private/lng_private`; rounded public coords are derived for public use.
4. **Slug collision safety**: if a slug already exists, server appends numeric suffix (`-2`, `-3`, ...).
5. **Photo ingest**: uploads go to Supabase Storage bucket `project-photos` and each row is written to `project_photos` (includes `is_primary` and `blurhash` placeholder column), with higher multi-image limits in Admin UI.
6. **Image geo-tagging**: each photo row stores inherited geo context (`address_private`, private/public coords, geocode source), and JPEG uploads are written with GPS EXIF coordinates at upload time.
7. **Primary image**: admin can choose a main image at upload time and re-assign later.
8. **Alt-text intelligence**: upload route auto-generates geo-context captions when explicit caption is generic/filename-based.
9. **GBP queue**: create/update enqueues payload in `gbp_post_queue` (queue-first behavior).
10. **Index-on-commit trigger**: create/update performs best-effort ping to `/api/index-project` using `INDEXING_TOKEN` (placeholder until Google auth is fully wired).
11. **Schema graph linkage**: service hub exposes `#serviceHub` + `#service`; project pages link via `about` and `isPartOf`.

## GBP queue worker

- Endpoint: `POST /api/gbp/worker`
- Required header: `x-worker-token: <GBP_WORKER_TOKEN>`
- If GBP credentials are missing, queue remains pending by design.

## Production DB health check (10 seconds)

Open:

- `https://trustedroofingcalgary.com/api/health`

Expected for live Supabase:

- `supabaseEnabled: true`
- `dbReadOk: true`
- `dataMode: "supabase"`

If false:

- set/verify Supabase env vars on Vercel
- confirm tables exist from `supabase/schema.sql`
- verify Supabase policies / service-role availability for server writes

## Notes

- No doorway pages are generated. Only real published project nodes are listed.
- Homepage is crawl-safe by default (Calgary feed SSR) and client-refines to near-you after geolocation consent.


## InstantQuote (Next.js)

Public routes:

- `/instaquote`
- `/api/instaquote/estimate`
- `/api/instaquote/save-lead`
- `/api/instaquote/regional-feedback`
- `/api/instaquote/nearby`

Behavior:
- Every estimate request logs an address query row (`instaquote_address_queries`).
- Lead submissions link back via `address_query_id`.
- Nearby endpoint returns only non-personal query data.
