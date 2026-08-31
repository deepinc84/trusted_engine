import { canonicalUrl } from "./seo";

export const ORGANIZATION_ID = `${canonicalUrl("/")}#organization`;
export const GOOGLE_BUSINESS_URL = "https://maps.google.com/?cid=10122718143243142503";

export const organizationProfile = {
  "@type": "RoofingContractor",
  "@id": ORGANIZATION_ID,
  name: "Trusted Roofing & Exteriors",
  url: canonicalUrl("/"),
  logo: canonicalUrl("/transparent-logo.png"),
  image: canonicalUrl("/transparent-logo.png"),
  telephone: "+1-587-288-3351",
  priceRange: "$$",
  hasMap: GOOGLE_BUSINESS_URL,
  sameAs: [GOOGLE_BUSINESS_URL],
  address: {
    "@type": "PostalAddress",
    addressLocality: "Calgary",
    addressRegion: "AB",
    addressCountry: "CA"
  },
  areaServed: [
    {
      "@type": "City",
      name: "Calgary"
    }
  ]
} as const;

export const organizationSchema = {
  "@context": "https://schema.org",
  // Keep the shared fields available at the top level for LocalBusiness and
  // service schema builders while retaining the graph consumed by the layout.
  ...organizationProfile,
  "@graph": [organizationProfile]
};

export const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "RoofingContractor",
  "@id": `${canonicalUrl("")}#localbusiness`,
  name: organizationSchema.name,
  url: organizationSchema.url,
  logo: organizationSchema.logo,
  telephone: organizationSchema.telephone,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Calgary",
    addressRegion: "AB",
    addressCountry: "CA"
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 51.0276233,
    longitude: -114.087835
  },
  areaServed: organizationSchema.areaServed,
  sameAs: organizationSchema.sameAs
};
