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


## Shared page templates and design system

Shared components created for site-wide consistency:

- `components/site/SiteHeader.tsx` and `components/site/SiteFooter.tsx`
- `components/ui/PageContainer.tsx` and `components/ui/PageHero.tsx`
- `components/ui/CtaBand.tsx`
- `components/ui/ServiceCard.tsx`
- `components/ui/NeighborhoodChips.tsx`

Templates now using these shared components:

- `/services` landing page
- `/services/[slug]` detail template
- `/projects` index template
- `/projects/[slug]` detail template
- `/quote` page (functionality unchanged, visuals aligned)

To adjust inner-page styling globally, update the `ui-*` and `site-*` classes in `app/globals.css`.

## Homepage V3 data mapping

Homepage sections are now rendered with server components and map to data sources as follows:

- Hero recent activity: `instaquote_address_queries` ordered by `queried_at desc` (no static caching on homepage).
- Proof strip: `homepage_metrics` (with mock fallback defaults).
- Services: `services` table (`base_sales_copy` for card copy).
- Featured projects: published `projects` and `project_photos` (with placeholder image fallback if no photo rows exist).
- Service areas chips: `service_areas` table (`active = true`).

New schema migration for these homepage sections:

- `supabase/migrations/0006_homepage_content.sql`
- `supabase/migrations/0007_instaquote_scope_tracking.sql`

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

### Supabase fields the app expects for quote persistence/display

`instaquote_address_queries`:
- `id`
- `address` (stored private input)
- `service_type`
- `requested_scopes` (`text[]`)
- `place_id`
- `lat`, `lng`
- `roof_area_sqft`, `pitch_degrees`, `complexity_band`
- `area_source`, `data_source`
- `estimate_low`, `estimate_high` (**selected quoted range persisted here**)
- `solar_status`, `solar_debug`
- `queried_at`

`quote_events` (compat + analytics):
- `id`, `status`, `service_type`, `requested_scopes`
- `address`, `city`, `province`, `postal`, `lat`, `lng`
- `estimate_low`, `estimate_high`
- `notes` JSON (includes `service_type`, `requested_scopes`, extras, and roof/reference ranges)

If your Supabase is missing scope fields, run:
- `supabase/migrations/0007_instaquote_scope_tracking.sql`


## Developer notes: table ownership by section

Use this map when updating content:

- `homepage_metrics` → homepage proof strip metrics.
- `instaquote_address_queries` → homepage recent activity feed entries and quote analytics.
- `services` → `/services` landing cards and `/services/[slug]` content.
- `service_areas` → homepage neighborhood/service area chips.
- `projects` + `project_photos` → homepage featured projects and `/projects` cards/detail galleries.

If a section looks empty, verify rows exist in those tables (and that `projects.is_published = true` where applicable).


## Admin create flow (GBP paused)

Current create pipeline (no GBP dependency):

1. Project creation happens in `app/admin/projects/route.ts` (`POST`) via `createProject(...)`.
2. Linked geo post creation/upsert happens in `lib/db.ts` via `syncGeoPostForProject(projectId)` and is called immediately after project create/update.
3. Photo upload rows are created in `app/admin/upload/route.ts` + `addProjectPhoto(...)`, then `syncGeoPostForProject(projectId)` runs again so `geo_posts.primary_image_url` stays aligned to the current primary/first project photo.

GBP queue/posting was bypassed for admin create/update by removing `enqueueGbpPost(...)` from:
- `app/admin/projects/route.ts`
- `app/admin/projects/[id]/route.ts`

This means project + geo_post creation succeeds even when GBP is fully disabled.


## Bugfix notes (mobile shell + geo_posts upsert)

- Mobile header compactness is handled in `app/globals.css` under the `@media (max-width: 768px)` bugfix block. This keeps desktop shell styling intact while compressing logo/nav/CTA rows and reducing `main` top offset so content is no longer pushed/cut off.
- Admin “Create project” navigation continues to use `Link href="/admin/projects/new"`; the mobile mis-navigation was caused by oversized fixed-header overlap. The compact mobile header/touch layout resolves this by reducing header footprint and overlap.
- `geo_posts` 1:1 project alignment is enforced at DB level via `supabase/migrations/0008_geo_posts_project_unique.sql` (`unique index on geo_posts(project_id)`) and reflected in `supabase/schema.sql`.
- Geo-post sync logic lives in `lib/db.ts` (`syncGeoPostForProject`). It still uses upsert on `project_id`, and now includes a compatibility fallback path (read/update/insert) with clearer migration guidance if a DB is missing the unique constraint.

