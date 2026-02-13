import type { Project } from "@/lib/db";
import { canonicalUrl } from "@/lib/seo";

export default function ProjectSchema({ project }: { project: Project }) {
  const url = canonicalUrl(`/projects/${project.slug}`);
  const serviceUrl = canonicalUrl(`/services/${project.service_slug}`);

  const schema = {
    "@context": "https://schema.org",
    "@type": "CaseStudy",
    name: project.title,
    description: project.summary,
    url,
    about: {
      "@type": "Service",
      name: project.service_slug,
      url: serviceUrl
    },
    isPartOf: serviceUrl,
    contentLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: project.city,
        addressRegion: project.province
      },
      geo:
        project.lat_public !== null && project.lng_public !== null
          ? {
              "@type": "GeoCoordinates",
              latitude: project.lat_public,
              longitude: project.lng_public
            }
          : undefined
    },
    image: (project.photos ?? []).map((photo) => ({
      "@type": "ImageObject",
      url: photo.public_url,
      caption: photo.caption ?? undefined
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
