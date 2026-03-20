<<<<<<< codex/set-up-foundation-for-trustedroofing-site-bbrh8t
import { listGeoPosts, listProjects, listServices } from "@/lib/db";
=======
import { listProjects, listServices } from "@/lib/db";
>>>>>>> main
import { canonicalUrl } from "@/lib/seo";

function buildUrlset(urls: string[]) {
  const entries = urls.map((url) => `<url><loc>${url}</loc></url>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`;
}

export async function GET() {
<<<<<<< codex/set-up-foundation-for-trustedroofing-site-bbrh8t
  const [services, projects, geoPosts] = await Promise.all([
    listServices(),
    listProjects({ include_unpublished: false, limit: 2000 }),
    listGeoPosts()
=======
  const [services, projects] = await Promise.all([
    listServices(),
    listProjects({ include_unpublished: false, limit: 2000 })
>>>>>>> main
  ]);

  const urls = [
    canonicalUrl("/"),
    canonicalUrl("/services"),
    ...services.map((service) => canonicalUrl(`/services/${service.slug}`)),
    canonicalUrl("/projects"),
<<<<<<< codex/set-up-foundation-for-trustedroofing-site-bbrh8t
    ...projects.map((project) => canonicalUrl(`/projects/${project.slug}`)),
    canonicalUrl("/geo-posts"),
    ...geoPosts.flatMap((geoPost) => (geoPost.slug ? [canonicalUrl(`/geo-posts/${geoPost.slug}`)] : []))
=======
    ...projects.map((project) => canonicalUrl(`/projects/${project.slug}`))
>>>>>>> main
  ];

  return new Response(buildUrlset(urls), {
    headers: { "Content-Type": "application/xml" }
  });
}
