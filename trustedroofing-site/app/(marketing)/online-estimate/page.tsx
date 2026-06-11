import QuoteApplicationSchema, { quoteFaqItems } from "@/components/QuoteApplicationSchema";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import QuoteFlow from "@/components/QuoteFlow";
import QuoteActivitySummary from "@/components/QuoteActivitySummary";
import { buildMetadata } from "@/lib/seo";
import dynamicImport from "next/dynamic";
import Image from "next/image";

const FaqAccordion = dynamicImport(() => import("@/components/FaqAccordion"), {
  ssr: false,
  loading: () => <p className="homev3-copy">Loading FAQ…</p>
});

const quoteBenefits = [
  {
    title: "Download a free proposal first",
    body: "Generate your estimate and download a PDF proposal right away — no name, phone, or email required."
  },
  {
    title: "Compare scope options quickly",
    body: "Switch between roofing, siding, eavestrough, or whole-exterior work without leaving the quote flow."
  },
  {
    title: "Get follow-up only when you want it",
    body: "Detailed quote follow-up happens after the instant estimate, not before, so the tool stays usable and fast."
  }
] as const;

export const metadata = buildMetadata({
  title: "Instant quote",
  description: "Get an instant roofing, siding, or eavestrough estimate for Calgary homes using address-level property data and local project insights.",
  path: "/online-estimate",
  imagePath: "/Instant_estimate_hero.png"
});

export const dynamic = "force-dynamic";

const quoteFlowSteps = [
  {
    title: "Download a free proposal first",
    description: "Generate your estimate and download a PDF proposal right away — no name, phone, or email required."
  },
  {
    title: "Compare scope options quickly",
    description: "Switch between roofing, siding, eavestrough, or whole-exterior work without leaving the quote flow."
  },
  {
    title: "Get follow-up only when you want it",
    description: "Detailed quote follow-up happens after the instant estimate, not before, so the tool stays usable and fast."
  }
];

export default function QuotePage() {
  return (
    <>
      <QuoteApplicationSchema />
      <section className="online-estimate-hero">
        <Image
          className="online-estimate-hero__background"
          src="/Instant_estimate_hero.png"
          alt=""
          fill
          sizes="100vw"
          priority
        />
        <div className="online-estimate-hero__overlay" />
        <PageContainer>
          <div className="online-estimate-hero__layout">
            <div className="online-estimate-hero__content">
              <p className="homev3-eyebrow">Instant quote</p>
              <h1>Instant Roofing & Exterior Estimates for Calgary Homeowners</h1>
              <p className="online-estimate-hero__description">
                Enter your address for instant roofing, siding, and eavestrough pricing based on your Calgary home.
              </p>
              <ul className="online-estimate-hero__trust-list">
                {quoteBenefits.map((benefit) => (
                  <li key={benefit.title}>{benefit.title}</li>
                ))}
              </ul>
            </div>
            <div className="online-estimate-hero__form">
              <QuoteFlow />
            </div>
          </div>
        </PageContainer>
      </section>
      <section className="ui-page-section ui-page-section--soft ui-page-section--quote">
        <PageContainer>
          <div className="quote-page-stack">
            <section className="quote-flow-overview" aria-labelledby="quote-flow-overview-title">
              <div className="quote-flow-overview__header">
                <h2 id="quote-flow-overview-title">Get the estimate first, then decide what happens next</h2>
              </div>
              <div className="quote-flow-overview__grid">
                {quoteFlowSteps.map((step) => (
                  <article key={step.title} className="ui-card quote-flow-step">
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </article>
                ))}
              </div>
            </section>

            <div className="quote-support-stack">
              <article className="ui-card quote-support-card">
                <p className="ui-page-hero__eyebrow">How it works</p>
                <h2>Why this quote tool is different</h2>
                <p>
                  Most online roofing calculators are little more than a form wrapped around a weak average. They
                  ask for a postal code, ignore roof complexity, and spit back a number that feels precise but does
                  not help a homeowner make a real decision.
                </p>
                <p>
                  This tool is designed to keep the estimate itself first, then give you the context you need after
                  the pricing appears: what affects the range, how complexity changes the result, and what happens if
                  you want a detailed follow-up quote.
                </p>
              </article>
              <QuoteActivitySummary />

              <article className="ui-card quote-support-card">
                <p className="ui-page-hero__eyebrow">FAQ</p>
                <h2>Instant quote questions</h2>
                <FaqAccordion items={quoteFaqItems} />
              </article>
            </div>
          </div>
        </PageContainer>
      </section>
      <CtaBand
        title="Need to talk through options?"
        body="Submit your quote and we can refine material choices and timing with you."
      />
    </>
  );
}
