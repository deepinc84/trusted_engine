const SITE_URL = "https://www.trustedroofingcalgary.com";
const SEO_CRAWLERS = ["Googlebot", "Bingbot", "SemrushBot", "AhrefsBot", "SiteAuditBot"];
const PRIVATE_ROUTES = ["/api/", "/admin/", "/solar-suitability", "/test"];

function rule(userAgent: string) {
  return [
    `User-agent: ${userAgent}`,
    "Allow: /",
    ...PRIVATE_ROUTES.map(path => `Disallow: ${path}`)
  ].join("\n");
}

export async function GET() {
  const rules = [...SEO_CRAWLERS.map(rule), rule("*")].join("\n\n");
  const body = `${rules}\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;

  return new Response(body, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
}
