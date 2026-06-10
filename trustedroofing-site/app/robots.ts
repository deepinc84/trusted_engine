import type { MetadataRoute } from "next";

const SITE_URL = "https://www.trustedroofingcalgary.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/solar-suitability",
        "/test"
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
