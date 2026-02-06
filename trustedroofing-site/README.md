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

Replace `/public/logo.svg` and `/public/logo-mark.svg` with the official Trusted Roofing & Exteriors assets. The current files are neutral placeholders wired to the layout.

### 3) Run locally

```bash
npm run dev
```

Visit `http://localhost:3000` to view the site.

## Data model notes

- Projects are read from Supabase `projects` when configured.
- Quotes are stored as `quote_events` with two steps (address first, contact second).
- Public APIs sanitize and round geo coordinates to protect privacy.

## Deployment (Vercel)

- Set `NEXT_PUBLIC_SITE_URL` to your Vercel domain.
- Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Vercel environment variables.
- The sitemap is available at `/api/sitemap`, and `robots.txt` references it.

## TODO

- Build admin ingestion for projects.
- Integrate Supabase Storage (or Cloudinary) for photos.
- Add real GeoBoost-based location feeds.
- Add real geocoding for postal code lookups.
- Improve heat map visualization.
- Connect the instant quote to the production estimator.
