export const ORGANIZATION_ID = "https://www.trustedroofingcalgary.com/#organization";
export const GOOGLE_BUSINESS_URL = "https://maps.google.com/?cid=10122718143243142503";

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${canonicalUrl("")}#organization`,
  name: "Trusted Roofing & Exteriors",
  url: canonicalUrl(""),
  logo: canonicalUrl("/transparent-logo.png"),
  telephone: "+1-587-288-3351",
  areaServed: ["Calgary, AB"],
  sameAs: [
    GOOGLE_BUSINESS_URL,
    "https://facebook.com/TrustedRoofingCalgary",
    "https://www.linkedin.com/company/trusted-roofing-exteriors/",
    "https://m.yelp.ca/biz/trusted-roofing-and-exteriors-calgary",
    "https://www.homestars.com/profile/trusted-roofing-and-exteriors-inc",
    "https://trustedpros.ca/company/trusted-roofing-and-exteriors"
  ]
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
