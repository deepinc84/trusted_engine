import { canonicalUrl } from "@/lib/seo";

const quoteApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Trusted Roofing & Exterior Instant Estimator",
  url: canonicalUrl("/quote"),
  description:
    "An anonymous, instant estimation tool for Calgary homeowners. Get an immediate price range for roofing, vinyl or Hardie siding, and eavestrough projects without providing any personal contact information.",
  applicationCategory: ["BusinessApplication", "DesignApplication"],
  operatingSystem: "All",
  featureList: [
    "Instant Roofing Cost Range",
    "Vinyl Siding Estimator",
    "James Hardie Siding Pricing",
    "Eavestrough & Gutter Calculations",
    "Full Exterior Project Bundling",
    "100% Anonymous - No Name/Email Required"
  ],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "CAD"
  },
  step: [
    {
      "@type": "HowToStep",
      name: "Enter Calgary Address",
      text: "Provide your property address to generate instant measurements for your roof and exterior walls."
    },
    {
      "@type": "HowToStep",
      name: "Select Siding and Gutter Options",
      text: "Choose between roofing materials, vinyl or Hardie siding, and eavestrough configurations."
    },
    {
      "@type": "HowToStep",
      name: "View Instant Estimate",
      text: "Receive your total exterior project range immediately. No contact details required to see your price."
    }
  ]
};

export default function QuoteApplicationSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(quoteApplicationSchema) }}
    />
  );
}
