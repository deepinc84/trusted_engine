import { listGeoPosts, listProjects, listServices } from "@/lib/db";
import { getAllQuoteCards, getAllQuoteNeighborhoods } from "@/lib/seo-engine";
import { getPublishedBlogPosts } from "@/lib/blog";
import { canonicalUrl } from "@/lib/seo";
import { neighborhoodSlug } from "@/lib/serviceAreas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SitemapEntry = {
  loc: string;
  lastmod?: string;
  changefreq?: "hourly" | "daily" | "weekly" | "monthly";
  priority?: number;
};

function toIsoDate(value: string | null | undefined) {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

function latestIso(...values: Array<string | null | undefined>) {
  const timestamps = values
    .map((value) => {
      const iso = toIsoDate(value);
      return iso ? new Date(iso).getTime() : null;
    })
    .filter((timestamp): timestamp is number => typeof timestamp === "number");

  if (timestamps.length === 0) return undefined;
  return new Date(Math.max(...timestamps)).toISOString();
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}


const redirectedServicePaths = new Set([
  "/services/roofing/roof-repair",
  "/services/roofing/roof-replacement",
  "/services/roofing/roof-inspection",
  "/services/roofing/roof-maintenance",
  "/services/roof-replacements",
  "/services/roof-replacement-calgary",
  "/services/residential-roofing",
  "/services/asphalt-shingles",
  "/services/asphalt-shingle-roofing",
  "/services/shingle-roofing",
  "/services/roof-repairs",
  "/services/leak-repair",
  "/services/roof-leak-repair",
  "/services/emergency-roof-repair",
  "/services/storm-damage-roof-repair",
  "/services/hail-damage-roof-repair",
  "/services/roof-inspection",
  "/services/roof-inspections",
  "/services/roof-maintenance",
  "/services/roof-maintenance-calgary",
  "/services/hail-damage-roof-inspection",
  "/services/gutters",
  "/services/hardie-siding",
  "/services/hardie-board-siding",
  "/services/fiber-cement-siding",
  "/services/eavestroughs",
  "/services/soft-metal",
  "/services/soft-metal-exteriors",
  "/services/fascia-soffit",
  "/services/vinyl-siding-calgary"
]);

const serviceSlugToPublicPath = (slug: string) => {
  if (slug === "gutters") return "/services/eavestrough";
  return `/services/${slug}`;
};

function uniqueUrls(urls: SitemapEntry[]) {
  const seen = new Set<string>();
  return urls.filter((url) => {
    if (redirectedServicePaths.has(new URL(url.loc).pathname)) return false;
    if (seen.has(url.loc)) return false;
    seen.add(url.loc);
    return true;
  });
}

function buildUrlset(urls: SitemapEntry[]) {
  const entries = urls.map((url) => [
    "<url>",
    `<loc>${escapeXml(url.loc)}</loc>`,
    url.lastmod ? `<lastmod>${escapeXml(url.lastmod)}</lastmod>` : "",
    url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : "",
    typeof url.priority === "number" ? `<priority>${url.priority.toFixed(1)}</priority>` : "",
    "</url>"
  ].join("")).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`;
}

export async function GET() {
  const [services, projects, serviceAreas, geoPosts, quoteCards] = await Promise.all([
    listServices(),
    listProjects({ include_unpublished: false, limit: 2000 }),
    getAllQuoteNeighborhoods(),
    listGeoPosts(2000),
    getAllQuoteCards()
  ]);

  const generatedAt = new Date().toISOString();
  const latestProjectLastmod = latestIso(...projects.flatMap((project) => [project.created_at, project.completed_at]));
  const latestGeoPostLastmod = latestIso(...geoPosts.flatMap((post) => [post.published_at, post.created_at]));
  const latestQuoteLastmod = latestIso(...quoteCards.map((quote) => quote.queriedAt));
  const latestSiteActivityLastmod = latestIso(latestProjectLastmod, latestGeoPostLastmod, latestQuoteLastmod) ?? generatedAt;
  const publishedBlogPosts = getPublishedBlogPosts();

  const latestGeoPostByServiceSlug = new Map<string, string>();
  const latestProjectByServiceSlug = new Map<string, string>();
  const latestContentByAreaSlug = new Map<string, string>();

  for (const post of geoPosts) {
    const postLastmod = latestIso(post.published_at, post.created_at);
    if (post.service_slug && postLastmod) {
      latestGeoPostByServiceSlug.set(post.service_slug, latestIso(latestGeoPostByServiceSlug.get(post.service_slug), postLastmod) ?? postLastmod);
    }
    if (post.neighborhood && postLastmod) {
      const postAreaSlug = neighborhoodSlug(post.neighborhood);
      if (serviceAreas.some((area) => area.slug === postAreaSlug)) {
        latestContentByAreaSlug.set(postAreaSlug, latestIso(latestContentByAreaSlug.get(postAreaSlug), postLastmod) ?? postLastmod);
      }
    }
  }

  for (const project of projects) {
    const projectLastmod = latestIso(project.created_at, project.completed_at);
    if (!projectLastmod) continue;
    latestProjectByServiceSlug.set(project.service_slug, latestIso(latestProjectByServiceSlug.get(project.service_slug), projectLastmod) ?? projectLastmod);
    if (project.neighborhood) {
      const projectAreaSlug = neighborhoodSlug(project.neighborhood);
      if (serviceAreas.some((area) => area.slug === projectAreaSlug)) {
        latestContentByAreaSlug.set(projectAreaSlug, latestIso(latestContentByAreaSlug.get(projectAreaSlug), projectLastmod) ?? projectLastmod);
      }
    }
  }

  for (const area of serviceAreas) {
    const quoteLastmod = latestIso(...area.cards.map((card) => card.queriedAt));
    if (quoteLastmod) latestContentByAreaSlug.set(area.slug, latestIso(latestContentByAreaSlug.get(area.slug), quoteLastmod) ?? quoteLastmod);
  }

  const servicePageLastmod = (serviceSlug: string, fallback?: string | null) => latestIso(
    latestGeoPostByServiceSlug.get(serviceSlug),
    latestProjectByServiceSlug.get(serviceSlug),
    fallback
  ) ?? latestSiteActivityLastmod;

  const urls: SitemapEntry[] = [
    { loc: canonicalUrl("/"), lastmod: latestSiteActivityLastmod, changefreq: "daily", priority: 1.0 },
    { loc: canonicalUrl("/services"), lastmod: latestIso(latestGeoPostLastmod, latestProjectLastmod) ?? latestSiteActivityLastmod, changefreq: "weekly", priority: 0.9 },
    ...services.map((service) => ({ loc: canonicalUrl(serviceSlugToPublicPath(service.slug)), lastmod: servicePageLastmod(service.slug, service.created_at), changefreq: "weekly" as const, priority: 0.8 })),
    { loc: canonicalUrl("/services/roof-replacement"), lastmod: servicePageLastmod("roofing"), changefreq: "weekly", priority: 0.8 },
    { loc: canonicalUrl("/services/roof-inspection-maintenance"), lastmod: servicePageLastmod("roofing"), changefreq: "weekly", priority: 0.8 },
    { loc: canonicalUrl("/services/vinyl-siding"), lastmod: servicePageLastmod("vinyl-siding"), changefreq: "weekly", priority: 0.8 },
    { loc: canonicalUrl("/services/james-hardie-siding"), lastmod: servicePageLastmod("james-hardie-siding"), changefreq: "weekly", priority: 0.8 },
    { loc: canonicalUrl("/services/eavestrough-soffit-fascia"), lastmod: servicePageLastmod("eavestrough-soffit-fascia"), changefreq: "weekly", priority: 0.8 },
    { loc: canonicalUrl("/services/eavestrough"), lastmod: servicePageLastmod("gutters"), changefreq: "weekly", priority: 0.8 },
    { loc: canonicalUrl("/blog"), lastmod: latestSiteActivityLastmod, changefreq: "weekly", priority: 0.7 },
    ...publishedBlogPosts.map((post) => ({
      loc: canonicalUrl(`/blog/${post.slug}`),
      lastmod: new Date(post.publishAt).toISOString(),
      changefreq: "monthly" as const,
      priority: 0.6
    })),
    { loc: canonicalUrl("/projects"), lastmod: latestIso(latestProjectLastmod, latestGeoPostLastmod) ?? latestSiteActivityLastmod, changefreq: "hourly", priority: 0.95 },
    ...projects.map((project) => ({
      loc: canonicalUrl(`/projects/${project.slug}`),
      lastmod: latestIso(project.created_at, project.completed_at) ?? latestProjectLastmod ?? latestSiteActivityLastmod,
      changefreq: "weekly" as const,
      priority: 0.85
    })),
    { loc: canonicalUrl("/online-estimate"), lastmod: latestQuoteLastmod ?? latestSiteActivityLastmod, changefreq: "daily", priority: 0.9 },
    { loc: canonicalUrl("/quotes"), lastmod: latestQuoteLastmod ?? latestSiteActivityLastmod, changefreq: "hourly", priority: 0.95 },
    { loc: canonicalUrl("/service-areas"), lastmod: latestIso(latestQuoteLastmod, latestProjectLastmod, latestGeoPostLastmod) ?? latestSiteActivityLastmod, changefreq: "daily", priority: 0.85 },
    ...serviceAreas.map((area) => ({
      loc: canonicalUrl(`/service-areas/${area.slug}`),
      lastmod: latestContentByAreaSlug.get(area.slug) ?? latestQuoteLastmod ?? latestSiteActivityLastmod,
      changefreq: "daily" as const,
      priority: 0.8
    }))
  ];

  return new Response(buildUrlset(uniqueUrls(urls)), {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "no-store, max-age=0"
    }
  });
}
