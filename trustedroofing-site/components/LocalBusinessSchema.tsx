export default function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Trusted Roofing & Exteriors",
    areaServed: "Calgary, AB",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Calgary",
      addressRegion: "AB",
      addressCountry: "CA"
    },
    url: "https://trustedroofing.ca",
    description:
      "Modern roofing and exterior services with fast, data-driven project insights."
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
