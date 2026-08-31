# Calgary geography layer — Phase 1

This dormant, server-only layer imports the City of Calgary **Community District Boundaries** GeoJSON dataset (`surr-xmvs`). The catalogue page is <https://data.calgary.ca/Base-Maps/Community-District-Boundaries/surr-xmvs>; the update endpoint is <https://data.calgary.ca/resource/surr-xmvs.geojson?$limit=5000>. Production never calls either URL. Run `npm run geography:update` only when intentionally refreshing the committed generated JSON and report. `--input path/to/source.geojson` permits reproducible/offline review of a previously downloaded official response.

## Derivation choices

* Community code and name are official source fields. The official `sector` field is mapped conservatively to NW/NE/SW/SE; any other value remains `UNRESOLVED` rather than being guessed from a Trusted slug.
* Coordinates are retained at source precision. GeoJSON arrays are `[longitude, latitude]`; public utility inputs are `(latitude, longitude)`. Bounding-box rejection precedes ray-cast Polygon/MultiPolygon containment.
* The polygon area centroid is used when it lies on the surface. For irregular/concave polygons, a deterministic increasingly fine point-on-surface grid supplies the representative point.
* Two districts are adjacent when polygon boundary distance is at most **2 metres**, accommodating coordinate precision artifacts without turning centroid proximity into adjacency. Nearby means the nearest **six non-adjacent** polygons by polygon-boundary distance, ordered by distance then official code.
* Matching is exact, conservative normalized, or explicit alias only. It does not use edit-distance/fuzzy matching. The explicit alias registry starts empty; notably, Marda Loop is not silently forced onto Altadore or South Calgary.
* `lib/geography/calgary-geography.ts` has a `server-only` guard and is not imported by a page or client component. Full geometry therefore cannot enter current public client bundles.

## Existing architecture audit (unchanged)

Service-area routes are activity-driven, not a static geographic hierarchy. `buildUnifiedNeighborhoodActivities()` unions published instant quotes, projects, solar analyses, and project-linked geo-post enrichment, using the existing string resolver and generated slugs. The eight `service_areas` seeds (Mahogany, Auburn Bay, Cranston, Seton, Altadore, Marda Loop, Evergreen, Legacy) feed homepage chips; they do not activate detail pages by themselves.

The broad NW/NE/SW/SE experience is currently the quote heat map on `/service-areas`, based on stored quadrant strings. There are no static quadrant aggregation nodes in the repository. A detail page's “related active areas” is every other result returned by the unified activity builder (all-to-all, so a page emits `active area count - 1` links). The exact same complete list is passed to `DynamicSchema` as `isRelatedTo`. Service cards come from the fixed service link definitions. None of this is changed in Phase 1.

The sitemap independently reads current quote neighbourhood summaries and emits the same activity-driven service-area URLs. Metadata, breadcrumbs, schemas, activation/indexing, links, routes, and sitemap code do not import the geography layer and remain unchanged.

## Activity field audit

| Evidence | address | postal code | latitude / longitude | explicit neighbourhood | quadrant | city |
|---|---|---|---|---|---|---|
| Instant quote address query | yes | embedded/derivable from address; no dedicated query field | `lat`, `lng` | `neighborhood` | inferred from address by current resolver, not a query column | derived from address |
| Published project | address/street fields available internally | `postal_code` | public jittered `lat_public`, `lng_public` | `neighborhood` | `quadrant` | `city` |
| Geo-post | no independent full address | no | `lat_public`, `lng_public` | `neighborhood`; current aggregation prefers linked project | inherited from linked project during aggregation | `city` / linked project |
| Solar/property assessment | `address` | `postal_code` | `latitude`, `longitude` | `neighborhood`, `neighborhood_slug` | `quadrant` | `city` |

The current resolver remains string-based. Phase 2 can call the dormant polygon lookup against raw/private coordinates where policy permits; Phase 1 does not alter activity resolution.
