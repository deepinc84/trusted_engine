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
- `NEXT_PUBLIC_SITE_URL` (optional; canonical defaults are hardcoded to trustedroofingcalgary.com)

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
2. Upload multiple photos via `/admin/upload`
3. Publish writes to Supabase immediately
4. GBP payload is enqueued in `gbp_post_queue`

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
