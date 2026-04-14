import { listProjects, listServices } from "@/lib/db";
import { getAllQuoteNeighborhoods } from "@/lib/seo-engine";
import { canonicalUrl } from "@/lib/seo";

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

function buildUrlset(urls: SitemapEntry[]) {
  const entries = urls.map((url) => [
    "<url>",
    `<loc>${url.loc}</loc>`,
    url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : "",
    url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : "",
    typeof url.priority === "number" ? `<priority>${url.priority.toFixed(1)}</priority>` : "",
    "</url>"
  ].join("")).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`;
}

export async function GET() {
  const [services, projects, serviceAreas] = await Promise.all([
    listServices(),
    listProjects({ include_unpublished: false, limit: 2000 }),
    getAllQuoteNeighborhoods()
  ]);

  const now = new Date().toISOString();
  const urls: SitemapEntry[] = [
    { loc: canonicalUrl("/"), lastmod: now, changefreq: "daily", priority: 1.0 },
    { loc: canonicalUrl("/services"), lastmod: now, changefreq: "weekly", priority: 0.9 },
    ...services.map((service) => ({ loc: canonicalUrl(`/services/${service.slug}`), lastmod: toIsoDate(service.created_at) ?? now, changefreq: "weekly" as const, priority: 0.8 })),
    { loc: canonicalUrl("/services/james-hardie-siding"), lastmod: now, changefreq: "weekly", priority: 0.8 },
    { loc: canonicalUrl("/blog"), lastmod: now, changefreq: "weekly", priority: 0.7 },
    { loc: canonicalUrl("/blog/how-much-does-a-roof-replacement-cost-in-calgary-2026"), lastmod: now, changefreq: "monthly", priority: 0.6 },
    { loc: canonicalUrl("/projects"), lastmod: now, changefreq: "hourly", priority: 0.95 },
    ...projects.map((project) => ({
      loc: canonicalUrl(`/projects/${project.slug}`),
      lastmod: toIsoDate(project.created_at) ?? toIsoDate(project.completed_at) ?? now,
      changefreq: "weekly" as const,
      priority: 0.85
    })),
    { loc: canonicalUrl("/online-estimate"), lastmod: now, changefreq: "daily", priority: 0.9 },
    { loc: canonicalUrl("/quotes"), lastmod: now, changefreq: "hourly", priority: 0.95 },
    { loc: canonicalUrl("/service-areas"), lastmod: now, changefreq: "daily", priority: 0.85 },
    ...serviceAreas.map((area) => ({ loc: canonicalUrl(`/service-areas/${area.slug}`), lastmod: now, changefreq: "daily" as const, priority: 0.8 }))
  ];

  return new Response(buildUrlset(urls), {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400"
    }
  });
}
