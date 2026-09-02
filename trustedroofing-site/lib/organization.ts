import { canonicalUrl } from "./seo";

export const ORGANIZATION_ID = `${canonicalUrl("/")}#organization`;
export const GOOGLE_BUSINESS_URL = "https://maps.google.com/?cid=10122718143243142503";
export const ORGANIZATION_SAME_AS = [
  GOOGLE_BUSINESS_URL,
  "https://facebook.com/TrustedRoofingCalgary",
  "https://www.linkedin.com/company/trusted-roofing-exteriors/",
  "https://trustedpros.ca/company/trusted-roofing-and-exteriors",
  "https://m.yelp.ca/biz/trusted-roofing-and-exteriors-calgary",
  "https://www.cityofcalgary.com/directory/home-services-contractors/trusted-roofing-and-exteriors/",
  "https://www.alberta-local.ca/biz/55509/trusted-roofing-and-exteriors",
  "https://calgaryconstructionnetwork.com/directory/listing/trusted-roofing-exteriors-calgary",
  "https://shopcalgary.ca/trustedroofingandexteriors",
  "https://www.doineedaroofer.com/directory/trusted-roofing-exteriors-calgary",
  "https://www.yellowpages.ca/bus/Alberta/Trusted-Roofing-And-Exteriors/105293740.html",
  "https://albertadirectory.com/business/7e4eb3a1-425f-4d74-bfca-e49e0980c471",
  "https://ca.nextdoor.com/pages/trusted-roofing-exteriors-calgary-ab/",
  "https://www.homestars.com/profile/trusted-roofing-and-exteriors-inc",
  "https://www.ringmybiz.com/business/trusted-roofing-exteriors-5d309a3e",
  "https://www.profilecanada.com/companydetail.cfm?company=320359_",
  "https://medium.com/@info_93117/about"
] as const;

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
  sameAs: ORGANIZATION_SAME_AS,
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
