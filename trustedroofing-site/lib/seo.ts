import type { Metadata } from "next";

export const SITE_URL = "https://www.trustedroofingcalgary.com";
export const DEFAULT_SOCIAL_IMAGE = "/opengraph-image";

export function canonicalUrl(path = "") {
  return `${SITE_URL}${path}`;
}

export function buildMetadata({
  title,
  description,
  path = "",
  robots,
  imagePath
}: {
  title: string;
  description: string;
  path?: string;
  robots?: Metadata["robots"];
  imagePath?: string;
}): Metadata {
  const fullTitle = title;
  const imageUrl = canonicalUrl(imagePath ?? DEFAULT_SOCIAL_IMAGE);

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
      siteName: "Trusted Roofing & Exteriors",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: "Trusted Roofing & Exteriors in Calgary" }]
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [imageUrl]
    }
  };
}
