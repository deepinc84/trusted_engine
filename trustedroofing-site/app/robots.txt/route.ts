export async function GET() {
  const baseUrl = "https://trustedroofingcalgary.com";
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${baseUrl}/api/sitemap\n`, {
    headers: { "Content-Type": "text/plain" }
  });
}
