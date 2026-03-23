import type { Metadata } from "next";

export const SITE_URL = "https://trustedroofingcalgary.com";

export function canonicalUrl(path = "") {
  return `${SITE_URL}${path}`;
}

export function buildMetadata({
  title,
  description,
  path = "",
  robots
}: {
  title: string;
  description: string;
  path?: string;
  robots?: Metadata["robots"];
}): Metadata {
  const fullTitle = `${title} | Trusted Roofing & Exteriors`;

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: canonicalUrl(path) },
    robots,
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl(path),
      siteName: "Trusted Roofing & Exteriors"
    }
  };
}
