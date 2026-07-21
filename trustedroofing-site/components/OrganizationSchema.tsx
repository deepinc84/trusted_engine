import { canonicalUrl } from "@/lib/seo";

export default function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${canonicalUrl("")}#organization`,
    name: "Trusted Roofing & Exteriors",
    url: canonicalUrl(""),
    logo: canonicalUrl("/logo.svg"),
    telephone: "+1-403-615-5551",
    areaServed: ["Calgary, AB"],
    sameAs: [
      "https://www.facebook.com/trustedroofingandexteriors",
      "https://www.instagram.com/trustedroofingandexteriors/"
    ]
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
