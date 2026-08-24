export const ORGANIZATION_ID = "https://www.trustedroofingcalgary.com/#organization";
export const GOOGLE_BUSINESS_URL = "https://maps.google.com/?cid=10122718143243142503";

export const organizationSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "RoofingContractor",
      "@id": ORGANIZATION_ID,
      name: "Trusted Roofing & Exteriors",
      url: "https://www.trustedroofingcalgary.com/",
      logo: "https://www.trustedroofingcalgary.com/transparent-logo.png",
      image: "https://www.trustedroofingcalgary.com/transparent-logo.png",
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
    }
  ]
};
