export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trustedroofing.ca";
  return new Response(
    `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/api/sitemap\n`,
    {
      headers: {
        "Content-Type": "text/plain"
      }
    }
  );
}
