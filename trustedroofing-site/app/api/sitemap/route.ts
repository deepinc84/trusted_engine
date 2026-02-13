import { listProjects, listServices } from "@/lib/db";
import { canonicalUrl } from "@/lib/seo";

function buildUrlset(urls: string[]) {
  const entries = urls.map((url) => `<url><loc>${url}</loc></url>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`;
}

export async function GET() {
  const [services, projects] = await Promise.all([
    listServices(),
    listProjects({ include_unpublished: false, limit: 2000 })
  ]);

  const urls = [
    canonicalUrl("/"),
    canonicalUrl("/services"),
    ...services.map((service) => canonicalUrl(`/services/${service.slug}`)),
    canonicalUrl("/projects"),
    ...projects.map((project) => canonicalUrl(`/projects/${project.slug}`))
  ];

  return new Response(buildUrlset(urls), {
    headers: { "Content-Type": "application/xml" }
  });
}
