import type { Project } from "@/lib/db";
import type { QuoteNeighborhoodSummary } from "@/lib/seo-engine";
import { canonicalUrl } from "@/lib/seo";

type ProjectSchemaProps = {
  projectData: Project;
  relatedNeighborhoods?: Array<{ slug: string; neighborhood: string }>;
  quoteData?: never;
};

type QuoteSchemaProps = {
  quoteData: QuoteNeighborhoodSummary;
  relatedNeighborhoods?: Array<{ slug: string; neighborhood: string }>;
  projectData?: never;
};

type Props = ProjectSchemaProps | QuoteSchemaProps;

export default function DynamicSchema(props: Props) {
  const schema = props.projectData
    ? buildProjectSchema(props.projectData, props.relatedNeighborhoods ?? [])
    : buildQuoteSchema(props.quoteData, props.relatedNeighborhoods ?? []);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function buildNeighborhoodGeo(lat: number | null, lng: number | null) {
  if (typeof lat !== "number" || typeof lng !== "number") return undefined;
  return {
    "@type": "GeoCoordinates",
    latitude: Number(lat.toFixed(3)),
    longitude: Number(lng.toFixed(3))
  };
}

function buildProjectSchema(project: Project, relatedNeighborhoods: Array<{ slug: string; neighborhood: string }>) {
  const projectUrl = canonicalUrl(`/projects/${project.slug}`);
  const neighborhoodName = project.neighborhood ?? project.city;

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Trusted Roofing & Exteriors",
    url: canonicalUrl(""),
    areaServed: {
      "@type": "Place",
      name: `${neighborhoodName}, ${project.city}`,
      address: {
        "@type": "PostalAddress",
        addressLocality: project.city,
        addressRegion: project.province,
        addressCountry: "CA"
      },
      geo: buildNeighborhoodGeo(project.lat_public ?? null, project.lng_public ?? null)
    },
    hasPart: {
      "@type": "Project",
      name: project.title,
      description: project.summary,
      url: projectUrl,
      category: project.service_slug,
      image: (project.photos ?? []).map((photo) => photo.public_url),
      areaServed: {
        "@type": "Place",
        name: `${neighborhoodName}, ${project.city}`,
        geo: buildNeighborhoodGeo(project.lat_public ?? null, project.lng_public ?? null)
      },
      isRelatedTo: relatedNeighborhoods.map((area) => canonicalUrl(`/service-areas/${area.slug}`))
    }
  };
}

function buildQuoteSchema(quote: QuoteNeighborhoodSummary, relatedNeighborhoods: Array<{ slug: string; neighborhood: string }>) {
  const url = canonicalUrl(`/service-areas/${quote.slug}`);
  const lowPrice = quote.averageLow ?? undefined;
  const highPrice = quote.averageHigh ?? undefined;

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Trusted Roofing & Exteriors",
    url: canonicalUrl(""),
    address: {
      "@type": "PostalAddress",
      addressLocality: quote.city,
      addressRegion: "AB",
      addressCountry: "CA"
    },
    areaServed: {
      "@type": "Place",
      name: `${quote.neighborhood}, ${quote.city}`,
      geo: buildNeighborhoodGeo(quote.centroidLat ?? null, quote.centroidLng ?? null)
    },
    makesOffer: {
      "@type": "AggregateOffer",
      url,
      lowPrice,
      highPrice,
      priceCurrency: "CAD",
      offerCount: quote.quoteCount,
      offers: quote.cards.slice(0, 3).map((card) => ({
        "@type": "Offer",
        name: card.title,
        description: card.description,
        priceCurrency: "CAD",
        lowPrice: card.estimateLow ?? lowPrice,
        highPrice: card.estimateHigh ?? highPrice,
        areaServed: {
          "@type": "Place",
          name: `${card.neighborhood}, ${card.city}`,
          geo: buildNeighborhoodGeo(quote.centroidLat ?? null, quote.centroidLng ?? null)
        }
      })),
      isRelatedTo: relatedNeighborhoods.map((area) => canonicalUrl(`/service-areas/${area.slug}`))
    }
  };
}
