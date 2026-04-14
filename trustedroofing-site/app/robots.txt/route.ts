export async function GET() {
  const baseUrl = "https://www.trustedroofingcalgary.com";
  return new Response(`User-agent: *\nAllow: /\n# Dynamic sitemap with lastmod/changefreq entries\nSitemap: ${baseUrl}/sitemap.xml\nSitemap: ${baseUrl}/api/sitemap\n`, {
    headers: { "Content-Type": "text/plain" }
  });
}
