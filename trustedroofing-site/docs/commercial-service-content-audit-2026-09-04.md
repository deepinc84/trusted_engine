# Commercial service content audit and roadmap

Date: 2026-09-04

## Method and scoring

This is a source-level audit of the commercial routes, their metadata, visible editorial sections, links, schema components, conversion paths, and database-backed project/activity components. Priority combines commercial intent, likely conversion value, present editorial depth, and the opportunity stated in the project brief. No repository export of Google Search Console queries or impressions was found, so the ranking does not claim to use unavailable performance data.

Authored word counts are approximate. They exclude navigation, footer text, schema-only strings, and database content that varies at render time. A `PageHero` supplies the single visible H1 on these routes. Dedicated pages use `buildMetadata` for title, description, canonical, and social metadata.

## Page inventory and priority

| Priority | Route | Approx. authored depth | Current strengths | Most important remaining gap |
|---|---|---:|---|---|
| **CRITICAL** | `/services/james-hardie-siding` | about 1,500 words after this pass | Dedicated metadata and Service/FAQ schema, Calgary conditions, system comparison, cost factors, repair decisions, installation process, failure points, maintenance, two conversion paths, related-system links, dynamic Hardie-filtered activity | Add more verified Hardie-specific project records and owner-approved workmanship terms |
| **CRITICAL** | `/services/roof-replacement` | about 1,500 words | Deep system, material, cost, process, ventilation, failure, FAQ, estimator, and dynamic project coverage | Validate editorial claims against the current field scope and monitor GSC landing-page queries |
| **CRITICAL** | `/services/roof-repair` | about 1,000 words after this pass | Leak diagnosis, cost variables, repair versus replacement, failure modes, realistic process, direct phone and estimator paths, neighbourhood and dynamic work evidence | Add a focused visible FAQ with matching FAQ schema if real customer questions support it |
| **HIGH** | `/services/roofing` | about 600 words | Strong service hub and links to the principal roofing decisions | Add a concise roof-system anatomy section and clearer assessment-versus-estimate routing |
| **HIGH** | `/services/roof-inspection-maintenance` | about 500 words | Calgary storm context, inspection checkpoints, decision links, dynamic local activity | Explain deliverables, limitations, attic review, documentation, and maintenance sequencing in greater depth |
| **HIGH** | `/services/roof-rejuvenation` | about 800 words | Distinct qualification intent, comparisons, FAQ, dynamic evidence, test coverage | Add owner-confirmed product/process boundaries and explicit disqualifying conditions if not already complete |
| **HIGH** | `/services/siding` | about 650 words | Useful category hub, material routes, water-management and related exterior links | Add wall-assembly diagnostic guidance and repair-versus-recladding decisions |
| **HIGH** | `/services/eavestrough` | about 900 words | Drainage detail, pricing factors, process, FAQ, connected systems, project activity | Strengthen repair-versus-replacement examples using verified projects |
| **MEDIUM** | `/services/vinyl-siding` | about 1,000 words | Extensive Calgary, material, price, installation and comparison coverage | Add more verified vinyl project evidence and maintenance/repair matching examples |
| **MEDIUM** | `/services/eavestrough-soffit-fascia` | about 500 words | Explains the connected roof-edge system and links to dedicated services | Expand sequencing and diagnosis, or consolidate intent only after reviewing GSC cannibalization |
| **MEDIUM** | `/services/soffit-fascia` (dynamic service route) | database-dependent | Dynamic service/project architecture and a dedicated conditional content block | Move essential static soffit ventilation and fascia-interface guidance outside the database fallback |
| **LOW** | `/services/solar` | about 200 words | Dedicated solar path and schema | Keep outside the initial exterior-services pass unless it is an active commercial priority |

The broader architecture also contains asphalt shingle and hail/storm intent within roofing, replacement, repair, blog, project, and dynamic service data. There is no dedicated static `/services/asphalt-shingle-roofing` or hail service route in this checkout. A new money page should only be introduced after confirming the GBP taxonomy, GSC demand, and a distinct conversion intent rather than duplicating existing coverage.

## Audit observations across the 20 review dimensions

- **Metadata and H1:** Dedicated commercial routes use unique metadata and canonical paths through `buildMetadata`. `PageHero` supplies the H1. No second literal H1 was found in the audited page sources.
- **Homeowner intent:** Replacement, repair, material comparison, inspection, maintenance, drainage, and estimate intent are represented. Repair and Hardie now provide both budget-planning and condition-assessment paths.
- **Technical depth:** Roof replacement and the two expanded pages provide the strongest static operational detail. The roofing hub and inspection route remain thinner than their commercial role warrants.
- **Calgary context:** Hail, wind, freeze-thaw, chinooks, drainage, sun, and seasonal conditions are used only where relevant. Local proof is primarily supplied through real geo posts and projects rather than lists of neighbourhood names.
- **Cost and decisions:** No unsupported fixed consumer prices were added. The pages explain scope variables and link to existing estimate logic. Repair-versus-replacement guidance is explicit on the major decision pages.
- **Trust and proof:** `ServiceGeoPosts` preserves database-backed work evidence. Project links remain crawlable. No sample job, certification, warranty, review, or statistic was invented.
- **Internal links:** Roofing pages form a reciprocal replacement, repair, inspection, rejuvenation, and estimate cluster. Siding pages connect Hardie, vinyl, the siding hub, eavestrough, soffit/fascia, combined roof-edge work, projects, service areas, and estimate flows.
- **Schema:** Existing `ServiceSchema`, breadcrumb schema, and dedicated visible-FAQ schema are retained. The Hardie FAQ graph now reflects the two new visible questions. Schema is not used for hidden claims.
- **Calls to action:** Replacement and comparison visitors can use the instant estimator. Repair, leak, damage, and uncertain-condition visitors can call directly rather than being forced through the estimator.

## GBP and website semantic relationship map

The repository does not contain a verified export of the live GBP categories and services. The following is therefore a website-side alignment map to compare with the live profile, not a claim about current GBP configuration.

| Service concept to verify in GBP | Primary page | Supporting intent | Evidence and location signals | Schema and related services |
|---|---|---|---|---|
| James Hardie / fibre cement siding installation | `/services/james-hardie-siding` | Hardie versus vinyl article; cost, repair, maintenance, warranty and installation sections | Hardie-filtered `ServiceGeoPosts`, siding project archive, service-area index | Service + FAQ + breadcrumb; siding, vinyl, soffit/fascia, eavestrough |
| Roof replacement | `/services/roof-replacement` | Replacement cost, quote contents, repair-versus-replacement, hail articles | Replacement project feed, project detail links, neighbourhood/service-area routes | Service + FAQ/breadcrumb already present; roofing, repair, inspection, rejuvenation, estimate |
| Roof repair / leak and storm repair | `/services/roof-repair` | Repair cost, wind and hail resources | Roofing/repair geo posts and relevant neighbourhood evidence | Service; roofing, replacement, inspection, rejuvenation |
| Roof inspection and maintenance | `/services/roof-inspection-maintenance` | Storm, leak and aging-shingle decision resources | Roofing-family geo posts and service areas | Service; repair, replacement, roofing |
| Siding installation / replacement | `/services/siding` | Hardie-versus-vinyl article and dedicated material pages | Siding projects and geo posts | Service/FAQ where present; Hardie, vinyl, roof-edge systems |
| Eavestrough, soffit and fascia | Dedicated and combined service pages | Eavestrough cost article and drainage guidance | Service-specific activity and connected project evidence | Service/FAQ where present; roofing, siding, roof-edge interfaces |

## Prioritized supporting content plan

1. **Roof flashing failures at walls, chimneys, skylights, and valleys.** Distinct diagnostic intent that supports repair, inspection, and replacement without duplicating their commercial scope.
2. **Roof ventilation and attic moisture in Calgary.** Explain intake/exhaust balance, frost versus exterior leaks, and why ventilation decisions belong in roof-system planning.
3. **Underlayment and ice/water membrane in a Calgary roof scope.** A system-component guide that supports quote comparison and replacement decisions.
4. **James Hardie cost factors in Calgary.** Create only if it can use verified estimator inputs and real scopes, rather than a generic price table.
5. **Siding transitions around windows, doors, decks, and rooflines.** A water-management resource supporting Hardie, vinyl, and the siding hub.
6. **Can fibre cement siding be repaired after impact damage?** Use documented project cases and matching constraints; avoid promises about hail resistance.
7. **Eavestrough overflow diagnosis.** Separate capacity, slope, outlet, blockage, roof geometry, downspout routing, and fascia-interface causes.

The existing Hardie-versus-vinyl, roof replacement cost, roof repair cost, quote-scope, repair-versus-replacement, eavestrough cost, hail, and wind articles should be updated and internally linked before creating overlapping variants.

## Facts requiring owner confirmation

- The exact live GBP primary/secondary categories and service list, including the preferred consumer-facing spelling of fibre/fiber cement.
- Current James Hardie products offered, product-zone selection, installer training or designation, written workmanship coverage, and the proposal language used alongside manufacturer warranties.
- Roof repair response times, emergency-service boundaries, inspection deliverables, reporting format, fees, and whether attic access is routinely included.
- Supported materials, brands, colours, financing, guarantees, and service-area boundaries beyond those already represented in repository content.
- Whether GSC data supports a separate asphalt-shingle or hail-damage money page, or indicates cannibalization among the combined and dedicated roof-edge pages.

These details were deliberately not invented in visible copy or structured data.
