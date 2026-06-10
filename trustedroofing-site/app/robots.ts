import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/solar-suitability"]
    },
    sitemap: "https://www.trustedroofingcalgary.com/sitemap.xml"
  };
}
