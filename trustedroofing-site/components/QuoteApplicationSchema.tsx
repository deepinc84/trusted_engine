import { canonicalUrl } from "@/lib/seo";

export const quoteFaqItems = [
  {
    question: "Can I get an instant roof quote without a salesperson visit?",
    answer:
      "Yes. You can start with an online estimate using your address before deciding whether you want a detailed site visit or follow-up quote."
  },
  {
    question: "Is the instant roof quote free?",
    answer:
      "Yes. The instant estimate is free to use, and you can review the estimate before choosing whether to request follow-up."
  },
  {
    question: "Do I need to enter my contact information first?",
    answer:
      "No. The tool is designed so Calgary homeowners can start with the estimate first. Contact details are only requested if you want detailed follow-up."
  },
  {
    question: "How accurate is the instant roofing estimate?",
    answer:
      "The estimate is a planning range based on address-level roof data, project scope, and local pricing bands. Final pricing is confirmed after details such as access, material choice, roof condition, and site-specific complexity are reviewed."
  },
  {
    question: "What information affects the roof quote?",
    answer:
      "Roof size, slope, complexity, layers, access, disposal, material selection, ventilation, flashing, and roof condition can all affect the final quote."
  },
  {
    question: "Can I estimate siding or eavestrough work too?",
    answer:
      "Yes. The tool can also help start estimates for vinyl siding, James Hardie siding, eavestrough, and larger exterior scopes."
  }
] as const;

const quoteApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Instant Roof Quote Calgary",
  url: canonicalUrl("/online-estimate"),
  description:
    "Free instant roofing, siding, and eavestrough estimate tool for Calgary homeowners using address-level roof data and local pricing bands.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "All",
  areaServed: {
    "@type": "City",
    name: "Calgary"
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "CAD"
  },
  keywords: [
    "instant roof quote",
    "instant roof estimate",
    "Calgary roof quote",
    "online roofing estimate",
    "instant exterior estimate",
    "roof estimate Calgary"
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
