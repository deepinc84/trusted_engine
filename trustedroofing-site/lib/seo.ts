import type { Metadata } from "next";

export const SITE_URL = "https://www.trustedroofingcalgary.com";

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
  const fullTitle = `${title} | Trusted Roofing & Exteriors`;
  const imageUrl = imagePath ? canonicalUrl(imagePath) : undefined;

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
      images: imageUrl ? [{ url: imageUrl }] : undefined
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: fullTitle,
      description,
      images: imageUrl ? [imageUrl] : undefined
    }
  };
}
