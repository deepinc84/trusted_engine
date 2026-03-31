import { listProjects, listServices } from "@/lib/db";
import { getAllQuoteNeighborhoods } from "@/lib/seo-engine";
import { canonicalUrl } from "@/lib/seo";

function buildUrlset(urls: string[]) {
  const entries = urls.map((url) => `<url><loc>${url}</loc></url>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`;
}

export async function GET() {
  const [services, projects, serviceAreas] = await Promise.all([
    listServices(),
    listProjects({ include_unpublished: false, limit: 2000 }),
    getAllQuoteNeighborhoods()
  ]);

  const urls = [
    canonicalUrl("/"),
    canonicalUrl("/services"),
    ...services.map((service) => canonicalUrl(`/services/${service.slug}`)),
    canonicalUrl("/services/james-hardie-siding"),
    canonicalUrl("/blog"),
    canonicalUrl("/blog/how-much-does-a-roof-replacement-cost-in-calgary-2026"),
    canonicalUrl("/projects"),
    ...projects.map((project) => canonicalUrl(`/projects/${project.slug}`)),
    canonicalUrl("/online-estimate"),
    canonicalUrl("/quotes"),
    canonicalUrl("/service-areas"),
    ...serviceAreas.map((area) => canonicalUrl(`/service-areas/${area.slug}`))
  ];

  return new Response(buildUrlset(urls), {
    headers: { "Content-Type": "application/xml" }
  });
}
