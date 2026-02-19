import type { Project } from "@/lib/db";
import { canonicalUrl } from "@/lib/seo";

export default function ProjectSchema({ project }: { project: Project }) {
  const url = canonicalUrl(`/projects/${project.slug}`);
  const serviceUrl = canonicalUrl(`/services/${project.service_slug}`);

  const placeName = project.neighborhood
    ? `${project.neighborhood}, ${project.city}`
    : `${project.city}, ${project.province}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "CaseStudy",
    name: project.title,
    description: project.summary,
    url,
    about: {
      "@type": "Service",
      "@id": `${serviceUrl}#service`,
      name: project.service_slug,
      url: serviceUrl
    },
    isPartOf: {
      "@id": `${serviceUrl}#serviceHub`,
      url: serviceUrl
    },
    contentLocation: {
      "@type": "Place",
      name: placeName,
      address: {
        "@type": "PostalAddress",
        addressLocality: project.city,
        addressRegion: project.province,
        addressCountry: "CA"
      }
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
