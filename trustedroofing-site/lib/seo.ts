import type { Metadata } from "next";

const defaultMeta = {
  title: "Trusted Roofing & Exteriors",
  description:
    "Trusted Roofing & Exteriors delivers fast, data-driven roofing and exterior work across Calgary.",
  url: "https://trustedroofing.ca"
};

export function buildMetadata({
  title,
  description,
  path = ""
}: {
  title: string;
  description?: string;
  path?: string;
}): Metadata {
  const fullTitle = `${title} | ${defaultMeta.title}`;
  const fullDescription = description ?? defaultMeta.description;
  return {
    title: fullTitle,
    description: fullDescription,
    metadataBase: new URL(defaultMeta.url),
    alternates: {
      canonical: path ? `${defaultMeta.url}${path}` : defaultMeta.url
    },
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url: path ? `${defaultMeta.url}${path}` : defaultMeta.url,
      siteName: defaultMeta.title
    }
  };
}
