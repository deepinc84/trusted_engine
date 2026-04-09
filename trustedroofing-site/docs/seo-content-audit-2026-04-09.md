# SEO + Content Audit (Repository-Level)

Generated: 2026-04-09 (UTC)

Method: static source audit of `app/(marketing)` and `app/instaquote`; word counts reflect authored copy detected in page files, so component-driven and DB-driven rendered words may be undercounted on some routes.


## Page-by-page inventory

| Route | Metadata setup | JSON-LD markup | H1 | H2 | Approx words (page file) | Dynamic features/data | Content depth flag |
|---|---|---|---:|---:|---:|---|---|
| `/` | static via buildMetadata() | LocalBusinessSchema component | 0 | 0 | 79 | force-dynamic SSR, reads DB/derived data | **Content-poor** |
| `/blog` | static via buildMetadata() | none | 0 | 1 | 0 | static page content | **Content-poor** |
| `/blog/how-much-does-a-roof-replacement-cost-in-calgary-2026` | static via buildMetadata() | inline script tag(s): 1 | 1 | 8 | 1055 | static page content | **Adequate** |
| `/geo-posts` | static via buildMetadata() | none | 0 | 0 | 0 | static page content | **Content-poor** |
| `/geo-posts/[slug]` | dynamic (generateMetadata) | ProjectSchema component | 0 | 0 | 9 | dynamic route params, reads DB/derived data | **Content-poor** |
| `/instaquote` | none | none | 0 | 0 | 0 | redirect only | **Content-poor** |
| `/online-estimate` | static via buildMetadata() | QuoteApplicationSchema component | 1 | 3 | 309 | force-dynamic SSR | **Adequate** |
| `/projects` | static via buildMetadata() | none | 0 | 6 | 612 | query-string filtering, reads DB/derived data | **Adequate** |
| `/projects/[slug]` | dynamic (generateMetadata) | DynamicSchema component | 0 | 1 | 15 | dynamic route params, reads DB/derived data | **Content-poor** |
| `/quote` | none | none | 0 | 0 | 0 | redirect only | **Content-poor** |
| `/quotes` | static via buildMetadata() | inline script tag(s): 1 | 0 | 5 | 234 | force-dynamic SSR, reads DB/derived data | **Content-poor** |
| `/service-areas` | static via buildMetadata() | none | 1 | 7 | 894 | force-dynamic SSR, reads DB/derived data | **Adequate** |
| `/service-areas/[slug]` | dynamic (generateMetadata) | DynamicSchema component | 0 | 2 | 40 | force-dynamic SSR, dynamic route params, reads DB/derived data | **Content-poor** |
| `/services` | static via buildMetadata() | inline script tag(s): 1 | 0 | 5 | 566 | reads DB/derived data | **Adequate** |
| `/services/[slug]` | dynamic (generateMetadata) | ServiceSchema component | 0 | 3 | 48 | dynamic route params, reads DB/derived data | **Content-poor** |
| `/services/gutters` | static via buildMetadata() | ServiceSchema component | 0 | 7 | 394 | static page content | **Adequate** |
| `/services/james-hardie-siding` | static via buildMetadata() | inline script tag(s): 1 | 0 | 7 | 509 | static page content | **Adequate** |
| `/services/roof-repair` | static via buildMetadata() | ServiceSchema component | 0 | 1 | 21 | static page content | **Content-poor** |
| `/services/roofing` | static via buildMetadata() | ServiceSchema component | 0 | 7 | 398 | static page content | **Adequate** |
| `/services/siding` | static via buildMetadata() | inline script tag(s): 1 | 0 | 8 | 551 | static page content | **Adequate** |
| `/services/solar` | static via buildMetadata() | ServiceSchema component | 0 | 1 | 21 | static page content | **Content-poor** |

## JSON-LD component map

- `LocalBusinessSchema`: emits `RoofingContractor` JSON-LD for homepage.

- `ServiceSchema`: emits graph containing `RoofingContractor`, `CollectionPage`, `Service`, and `ItemList` for service pages.

- `ProjectSchema`: emits `LocalBusiness` + `Project` relationship for geo-post detail pages.

- `DynamicSchema`: emits either project-centric or quote-neighborhood `LocalBusiness` schema depending on route context.

- `QuoteApplicationSchema`: emits array of `SoftwareApplication` + `FAQPage` schemas for estimator page.


## High-priority audit findings

1. **Thin-content templates**: `/services/roof-repair`, `/services/solar`, `/geo-posts/[slug]`, `/projects/[slug]`, `/service-areas/[slug]`, `/quotes`, `/blog`, and redirect-only `/quote` + `/instaquote` appear content-light in page source and rely on dynamic/child components.

2. **Heading architecture risk**: many pages render zero in-file `<h1>` because hero H1 is abstracted in `PageHero`; this is fine at runtime, but lint/testing should verify exactly one H1 in rendered output.

3. **Metadata consistency**: most marketing pages use `buildMetadata()` (good canonical + OG defaults), but redirect routes have no metadata and should likely be `noindex` redirect handlers if indexed accidentally.

4. **Dynamic crawl depth**: routes powered by DB reads (`listProjects`, quote aggregates, neighborhood pages) depend on available records; empty datasets can degrade indexable text volume.


## Recommended next actions

- Add automated rendered-page snapshot checks for: title, description, canonical, one H1, minimum word count threshold by template type.

- Add explicit `robots: { index: false, follow: true }` metadata (or 308 config) for pure redirect routes `/quote` and `/instaquote`.

- Expand static intro copy blocks for thin templates (especially repair/solar and archive indexes) so each has strong baseline crawlable text even with sparse DB content.

- Consider adding breadcrumb schema on deep pages (`projects/[slug]`, `service-areas/[slug]`, `geo-posts/[slug]`) to strengthen internal entity relationships.
