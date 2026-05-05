import type { Project, ResolvedGeoPost } from "@/lib/db";
import { canonicalUrl } from "@/lib/seo";
import { neighborhoodSlug } from "@/lib/serviceAreas";

type Props =
  | { project: Project; geoPost?: never }
  | { geoPost: ResolvedGeoPost; project?: never };



function buildNeighborhoodGeo(lat: number | null, lng: number | null) {
  if (typeof lat !== "number" || typeof lng !== "number") return undefined;
  return {
    "@type": "GeoCoordinates",
    latitude: Number(lat.toFixed(3)),
    longitude: Number(lng.toFixed(3))
  };
}

export default function ProjectSchema(props: Props) {
  let slug: string;
  let title: string;
  let summary: string;
  let city: string;
  let province: string;
  let neighborhood: string;
  let serviceSlug: string;
  let imageUrls: string[];
  let url: string;
  let projectUrl: string | null = null;
  let latPublic: number | null = null;
  let lngPublic: number | null = null;

  if ("geoPost" in props) {
    const geoPost = props.geoPost!;
    slug = geoPost.slug ?? geoPost.id;
    title = geoPost.title ?? geoPost.slug ?? "Geo post";
    summary = geoPost.summary ?? "Location-backed project post.";
    city = geoPost.city ?? "Calgary";
    province = geoPost.province ?? "AB";
    neighborhood = geoPost.neighborhood ?? city;
    serviceSlug = geoPost.service_slug ?? "roofing";
    imageUrls = geoPost.gallery.length > 0 ? geoPost.gallery : geoPost.heroImage ? [geoPost.heroImage] : [];
    url = canonicalUrl(`/services/${serviceSlug}`);
    latPublic = geoPost.lat_public ?? null;
    lngPublic = geoPost.lng_public ?? null;
    if (geoPost.slug) {
      projectUrl = canonicalUrl(`/projects/${geoPost.slug}`);
    }
  } else {
    const project = props.project!;
    slug = project.slug;
    title = project.title;
    summary = project.summary;
    city = project.city;
    province = project.province;
    neighborhood = project.neighborhood ?? city;
    serviceSlug = project.service_slug;
    imageUrls = (project.photos ?? []).map((photo) => photo.public_url);
    url = canonicalUrl(`/projects/${slug}`);
    latPublic = project.lat_public ?? null;
    lngPublic = project.lng_public ?? null;
  }

  const relatedServiceArea = canonicalUrl(`/service-areas/${neighborhoodSlug(neighborhood)}`);

  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Trusted Roofing & Exteriors",
    url: canonicalUrl(""),
    areaServed: {
      "@type": "Place",
      name: `${neighborhood}, ${city}`,
      address: {
        "@type": "PostalAddress",
        addressLocality: city,
        addressRegion: province,
        addressCountry: "CA"
      },
      geo: buildNeighborhoodGeo(latPublic, lngPublic)
    },
    hasPart: {
      "@type": "Project",
      name: title,
      description: summary,
      url,
      category: serviceSlug,
      image: imageUrls,
      areaServed: {
        "@type": "Place",
        name: `${neighborhood}, ${city}`,
        geo: buildNeighborhoodGeo(latPublic, lngPublic)
      },
      isRelatedTo: [relatedServiceArea]
    }
  };

  if (projectUrl) {
    (schema.hasPart as Record<string, unknown>).isPartOf = {
      "@type": "WebPage",
      url: projectUrl
    };
    (schema.hasPart as Record<string, unknown>).mentions = [projectUrl];
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
