import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "../app/robots.txt/route";

const PUBLIC_CRAWLERS = ["Googlebot", "Bingbot", "SemrushBot", "AhrefsBot", "SiteAuditBot"];
const PRIVATE_ROUTES = ["/api/", "/admin/", "/solar-suitability", "/test"];

test("SEO audit crawlers are explicitly allowed to crawl public landing pages", async () => {
  const response = await GET();
  const body = await response.text();

  for (const crawler of PUBLIC_CRAWLERS) {
    assert.match(body, new RegExp(`User-agent: ${crawler}\\nAllow: /`));
  }
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8");
});

test("all crawlers can crawl public pages while private routes remain excluded", async () => {
  const body = await (await GET()).text();

  assert.match(body, /User-agent: \*\nAllow: \//);
  for (const path of PRIVATE_ROUTES) assert.match(body, new RegExp(`Disallow: ${path}`));
  assert.doesNotMatch(body, /Disallow: \/solar\n/);
  assert.match(body, /Sitemap: https:\/\/www\.trustedroofingcalgary\.com\/sitemap\.xml/);
  assert.doesNotMatch(body, /api\/sitemap/);
});
