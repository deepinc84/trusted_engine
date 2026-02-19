import type { Metadata } from "next";

export const SITE_URL = "https://trustedroofingcalgary.com";

export function canonicalUrl(path = "") {
  return `${SITE_URL}${path}`;
}

export function buildMetadata({
  title,
  description,
  path = ""
}: {
  title: string;
  description: string;
  path?: string;
}): Metadata {
  const fullTitle = `${title} | Trusted Roofing & Exteriors`;

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: canonicalUrl(path) },
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl(path),
      siteName: "Trusted Roofing & Exteriors"
    }
  };
}
