import { canonicalUrl } from "@/lib/seo";

export const quoteFaqItems = [
  {
    question: "How accurate is the instant quote?",
    answer:
      "The instant quote uses address data, roof geometry, and current pricing bands to generate a fast planning range. We refine the final number after confirming access, material choices, and any site-specific complexity."
  },
  {
    question: "Do I need to enter my contact information first?",
    answer:
      "No. You can generate the instant estimate before sharing any contact details. Contact information is only requested if you want a detailed follow-up quote."
  },
  {
    question: "What project types can I price here?",
    answer:
      "The tool can model roofing, vinyl siding, Hardie siding, eavestrough work, and bundled full-exterior scopes for Calgary-area homes."
  },
  {
    question: "What happens after I submit my detailed quote request?",
    answer:
      "Once you submit, the team reviews the estimate, confirms scope assumptions, and follows up with next-step recommendations, timing, and any material options that affect the final price."
  }
] as const;

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

const quoteFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: quoteFaqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer
    }
  }))
};

export default function QuoteApplicationSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify([quoteApplicationSchema, quoteFaqSchema]) }}
    />
  );
}
