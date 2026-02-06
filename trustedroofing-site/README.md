# Trusted Roofing & Exteriors Site

High-performance lead generation site built with Next.js App Router + TypeScript for Trusted Roofing & Exteriors.

## Setup

### 1) Install dependencies

```bash
npm install
```

### 2) Environment variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_SITE_URL="https://trustedroofing.ca"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
NEXT_PUBLIC_IMAGE_PROVIDER="supabase"
NEXT_PUBLIC_CLOUDINARY_BASE="https://res.cloudinary.com/your-account/image/upload"
```

If Supabase variables are not set, the app uses mock data stored in `lib/db.ts`.

### Logos

The app is wired to `/public/logo.svg` and `/public/logo-mark.svg`.

- Replace these files directly with your official brand exports.
- If you maintain source references in `logos.md`, export final SVG/PNG assets and place them in `/public`.

### 3) Run locally

```bash
npm run dev
```

Visit `http://localhost:3000` to view the site.

## Geo-Boost + Projects

- `POST /api/projects` supports creating a project with an `images[]` array (bulk-ready gallery input).
- `POST /api/projects` with `{ "mode": "upload_batch", "files": [{"filename":"..."}] }` returns upload stubs for future Supabase/Cloudinary signed URLs.
- Carousel cards intentionally show only the first project image; full project records can keep multiple gallery images.

## Instant Quote scopes

The quote funnel now begins with radio selection for:

- Roof
- Soft metals
- Vinyl siding
- Hardie siding
- Solar
- Full exterior package

Selected scope is stored in `requested_scopes` on step 1 and can be expanded later in your estimator.

## Deployment (Vercel)

- Set `NEXT_PUBLIC_SITE_URL` to your Vercel domain.
- Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Vercel environment variables.
- The sitemap is available at `/api/sitemap`, and `robots.txt` references it.

## TODO

- Integrate real signed upload URLs for Supabase Storage / Cloudinary.
- Wire Google APIs (address autocomplete, geocoding, and Solar API).
- Add Geo-Boost legacy ranking and heatmap improvements.
- Connect Instant Quote legacy calculations for final pricing logic.
