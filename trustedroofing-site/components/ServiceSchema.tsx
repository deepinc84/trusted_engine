import { canonicalUrl } from "@/lib/seo";

type Item = { name: string; url: string };

export default function ServiceSchema({
  serviceName,
  serviceSlug,
  serviceType,
  items = []
}: {
  serviceName: string;
  serviceSlug?: string;
  serviceType?: string;
  items?: Item[];
}) {
  const slug = serviceSlug ?? serviceType?.toLowerCase().replace(/\s+/g, "-") ?? "services";
  const serviceUrl = canonicalUrl(`/services/${slug}`);

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "RoofingContractor",
        "@id": `${canonicalUrl("")}#business`,
        name: "Trusted Roofing & Exteriors",
        areaServed: "Calgary, AB",
        url: canonicalUrl("")
      },
      {
        "@type": "CollectionPage",
        "@id": `${serviceUrl}#serviceHub`,
        url: serviceUrl,
        name: `${serviceName} projects in Calgary`
      },
      {
        "@type": "Service",
        "@id": `${serviceUrl}#service`,
        name: serviceName,
        serviceType: serviceName,
        provider: { "@id": `${canonicalUrl("")}#business` },
        url: serviceUrl
      },
      {
        "@type": "ItemList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "CreativeWork",
            name: item.name,
            url: item.url
          }
        }))
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
