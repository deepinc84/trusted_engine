# Next.js image cache-write audit

## Policy implemented

- Optimized derivatives have a 31-day minimum cache TTL (`2,678,400` seconds).
- WebP is the only negotiated optimized format. AVIF is intentionally omitted because it would create another derivative for each source, width, and quality combination without a demonstrated requirement on this site.
- Optimized photos use one quality tier, `75`. Source-provider query parameters do not define application quality tiers; the two static Unsplash URLs used by `next/image` are stable literals.
- Responsive candidates are limited to the widths the layouts use: device widths `640, 750, 828, 1080, 1200, 1600, 1920` and fixed image widths `32, 48, 64, 96, 128, 256, 384`.
- Logos, the 56-pixel footer mark, and SVG project placeholders bypass the optimizer. Their originals are already presentation-ready, and caching resized copies costs more than it saves.

## Usage audit

Every `next/image` usage was reviewed. Full-bleed page and home heroes correctly advertise `100vw`. Two-column editorial imagery advertises `50vw` on desktop and `100vw` on narrow screens. Three-column cards advertise `33vw`, then `50vw` and `100vw` at their responsive breakpoints. Fixed article content is capped at its actual 860/1240-pixel content width. Project gallery items follow the same three-column rule. These `sizes` values prevent the browser from requesting oversized candidates and, importantly for cache writes, reduce the number of widths requested in normal traffic.

The two brand raster files and all three project placeholder SVGs are unoptimized. Large photographic PNG/JPEG assets remain optimized; optimization was not disabled globally.

## Remote URL/cache-key stability

- `images.unsplash.com` sources are hard-coded URLs. Their query strings (`w`, `q`, `auto`, `fit`) are static, not timestamps or signatures. They therefore produce stable cache keys, although changing any of those literals in the future will create a new source key.
- Supabase project and geo-post photos use public-object URLs under `/storage/v1/object/public/**`. No signing token is generated in the marketing/admin card data path, so these keys are stable as long as stored `public_url` values are not rewritten with arbitrary query parameters.
- Proposal tools do generate Supabase signed URLs containing expiring tokens. They are rendered with native `<img>` elements or CSS backgrounds, not `next/image`, so token rotation does **not** create Vercel Image Optimization cache writes. They must not be migrated to `next/image` without replacing signed URLs with a stable proxy/path.
- Admin-entered blog and geo-post image fields can technically contain query strings. Blog previews use native `<img>`. Geo-post primary images do pass through `next/image`; editors should only choose the stable public project URLs offered by the UI. A future ingestion endpoint should reject expiry/signature parameters if arbitrary remote hosts are added.

## Likely causes of elevated writes

1. **Most likely:** `minimumCacheTTL` was unset, leaving derivatives on the much shorter framework/platform default. Frequently requested derivatives could therefore be revalidated or recreated many times during a 31-day period.
2. **High impact:** nearly every card/gallery image omitted `sizes`. For responsive rendering, Next treated those images as broadly viewport-sized or emitted/requested unsuitable candidates, multiplying source-by-width cache entries across mobile and desktop visits.
3. **Moderate impact:** the default width arrays included widths the application does not design for. Combined with missing `sizes`, this expanded the derivative key space.
4. **Moderate impact at scale:** SVG placeholders and tiny branding assets were sent through the optimizer, producing unnecessary per-width records for assets that should be served directly.
5. **Not supported as a current cause:** no rotating signed URL was found in a `next/image` call path. Signed proposal URLs exist, but use native image rendering. The optimized Unsplash and Supabase public URLs are stable.

The audit cannot assign exact write counts without Vercel usage logs, but TTL churn plus missing/inaccurate responsive sizing is the strongest explanation for unusually high cache-write volume.
