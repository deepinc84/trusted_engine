export default function ServiceSchema({
  serviceName,
  serviceType
}: {
  serviceName: string;
  serviceType: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: serviceName,
    serviceType,
    provider: {
      "@type": "LocalBusiness",
      name: "Trusted Roofing & Exteriors",
      areaServed: "Calgary, AB"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
