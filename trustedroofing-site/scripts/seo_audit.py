from __future__ import annotations
import re
from pathlib import Path
from dataclasses import dataclass

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "app"

PAGE_FILES = sorted((APP / "(marketing)").glob("**/page.tsx")) + [APP / "instaquote" / "page.tsx"]

@dataclass
class Row:
    route: str
    file: str
    metadata: str
    jsonld: str
    h1: int
    h2: int
    words: int
    dynamic: str
    content_flag: str


def route_from_file(path: Path) -> str:
    p = str(path.relative_to(APP))
    if p.startswith("(marketing)/"):
        p = p[len("(marketing)/"):]
    if p == "page.tsx":
        return "/"
    if p.endswith("/page.tsx"):
        p = p[:-len("/page.tsx")]
    return "/" + p.replace("\\", "/")


def compact_spaces(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def extract_visible_word_count(source: str) -> int:
    source = re.sub(r"\{\/\*.*?\*\/\}", " ", source, flags=re.S)
    texts = re.findall(r">([^<>{}][^<>]{1,})<", source)
    joined = compact_spaces(" ".join(texts))
    return len(re.findall(r"[A-Za-z0-9']+", joined))


def metadata_mode(source: str) -> str:
    if "generateMetadata" in source:
        return "dynamic (generateMetadata)"
    if "export const metadata" in source:
        if "buildMetadata(" in source:
            return "static via buildMetadata()"
        return "static metadata object"
    return "none"


def detect_jsonld(source: str, relpath: str) -> str:
    script_count = source.count("application/ld+json")
    if script_count:
        return f"inline script tag(s): {script_count}"

    mapping = {
        "app/(marketing)/page.tsx": "LocalBusinessSchema component",
        "app/(marketing)/online-estimate/page.tsx": "QuoteApplicationSchema component",
        "app/(marketing)/services/roofing/page.tsx": "ServiceSchema component",
        "app/(marketing)/services/roof-repair/page.tsx": "ServiceSchema component",
        "app/(marketing)/services/solar/page.tsx": "ServiceSchema component",
        "app/(marketing)/services/gutters/page.tsx": "ServiceSchema component",
        "app/(marketing)/services/[slug]/page.tsx": "ServiceSchema component",
        "app/(marketing)/services/siding/page.tsx": "ServiceSchema + inline FAQPage",
        "app/(marketing)/services/james-hardie-siding/page.tsx": "ServiceSchema + inline FAQPage",
        "app/(marketing)/projects/[slug]/page.tsx": "DynamicSchema component",
        "app/(marketing)/geo-posts/[slug]/page.tsx": "ProjectSchema component",
        "app/(marketing)/service-areas/[slug]/page.tsx": "DynamicSchema component",
    }
    return mapping.get(relpath, "none")


def dynamic_notes(source: str) -> str:
    notes = []
    if 'export const dynamic = "force-dynamic"' in source:
        notes.append("force-dynamic SSR")
    if "searchParams" in source:
        notes.append("query-string filtering")
    if "params" in source:
        notes.append("dynamic route params")
    if re.search(r"\b(list|get|count)[A-Z]\w*\(", source):
        notes.append("reads DB/derived data")
    if "redirect(" in source:
        notes.append("redirect only")
    return ", ".join(notes) if notes else "static page content"

rows: list[Row] = []
for page in PAGE_FILES:
    if not page.exists():
        continue
    source = page.read_text(encoding="utf-8")
    rel = str(page.relative_to(ROOT))
    words = extract_visible_word_count(source)
    row = Row(
        route=route_from_file(page),
        file=rel,
        metadata=metadata_mode(source),
        jsonld=detect_jsonld(source, rel),
        h1=source.count("<h1"),
        h2=source.count("<h2"),
        words=words,
        dynamic=dynamic_notes(source),
        content_flag="Content-poor" if words < 300 else "Adequate"
    )
    rows.append(row)

rows.sort(key=lambda r: (r.route != "/", r.route))

out = ROOT / "docs" / "seo-content-audit-2026-04-09.md"
lines = []
lines.append("# SEO + Content Audit (Repository-Level)\n")
lines.append("Generated: 2026-04-09 (UTC)\n")
lines.append("Method: static source audit of `app/(marketing)` and `app/instaquote`; word counts reflect authored copy detected in page files, so component-driven and DB-driven rendered words may be undercounted on some routes.\n")
lines.append("\n## Page-by-page inventory\n")
lines.append("| Route | Metadata setup | JSON-LD markup | H1 | H2 | Approx words (page file) | Dynamic features/data | Content depth flag |")
lines.append("|---|---|---|---:|---:|---:|---|---|")
for r in rows:
    lines.append(f"| `{r.route}` | {r.metadata} | {r.jsonld} | {r.h1} | {r.h2} | {r.words} | {r.dynamic} | **{r.content_flag}** |")

lines.append("\n## JSON-LD component map\n")
lines.append("- `LocalBusinessSchema`: emits `RoofingContractor` JSON-LD for homepage.\n")
lines.append("- `ServiceSchema`: emits graph containing `RoofingContractor`, `CollectionPage`, `Service`, and `ItemList` for service pages.\n")
lines.append("- `ProjectSchema`: emits `LocalBusiness` + `Project` relationship for geo-post detail pages.\n")
lines.append("- `DynamicSchema`: emits either project-centric or quote-neighborhood `LocalBusiness` schema depending on route context.\n")
lines.append("- `QuoteApplicationSchema`: emits array of `SoftwareApplication` + `FAQPage` schemas for estimator page.\n")

lines.append("\n## High-priority audit findings\n")
lines.append("1. **Thin-content templates**: `/services/roof-repair`, `/services/solar`, `/geo-posts/[slug]`, `/projects/[slug]`, `/service-areas/[slug]`, `/quotes`, `/blog`, and redirect-only `/quote` + `/instaquote` appear content-light in page source and rely on dynamic/child components.\n")
lines.append("2. **Heading architecture risk**: many pages render zero in-file `<h1>` because hero H1 is abstracted in `PageHero`; this is fine at runtime, but lint/testing should verify exactly one H1 in rendered output.\n")
lines.append("3. **Metadata consistency**: most marketing pages use `buildMetadata()` (good canonical + OG defaults), but redirect routes have no metadata and should likely be `noindex` redirect handlers if indexed accidentally.\n")
lines.append("4. **Dynamic crawl depth**: routes powered by DB reads (`listProjects`, quote aggregates, neighborhood pages) depend on available records; empty datasets can degrade indexable text volume.\n")

lines.append("\n## Recommended next actions\n")
lines.append("- Add automated rendered-page snapshot checks for: title, description, canonical, one H1, minimum word count threshold by template type.\n")
lines.append("- Add explicit `robots: { index: false, follow: true }` metadata (or 308 config) for pure redirect routes `/quote` and `/instaquote`.\n")
lines.append("- Expand static intro copy blocks for thin templates (especially repair/solar and archive indexes) so each has strong baseline crawlable text even with sparse DB content.\n")
lines.append("- Consider adding breadcrumb schema on deep pages (`projects/[slug]`, `service-areas/[slug]`, `geo-posts/[slug]`) to strengthen internal entity relationships.\n")

out.write_text("\n".join(lines), encoding="utf-8")
print(f"wrote {out}")
