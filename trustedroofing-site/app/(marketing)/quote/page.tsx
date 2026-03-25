import FaqAccordion from "@/components/FaqAccordion";
import QuoteApplicationSchema, { quoteFaqItems } from "@/components/QuoteApplicationSchema";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import QuoteFlow from "@/components/QuoteFlow";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Instant quote",
  description: "Anonymous instant roofing, siding, and eavestrough estimates for Calgary homeowners.",
  path: "/quote"
});

export const dynamic = "force-dynamic";

const quoteFlowSteps = [
  {
    title: "Start with the estimate first",
    description: "Use the address lookup and scope selector to see a planning range before you commit to a call."
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
      <section className="ui-page-hero ui-page-hero--quote">
        <PageContainer>
          <p className="homev3-eyebrow homev3-eyebrow--dark">Instant quote</p>
          <h1 className="homev3-title">Get your estimate in seconds</h1>
          <p className="homev3-copy">
            Address autocomplete, roof-data pricing, and nearby project proof in one flow.
          </p>
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

            <div className="quote-shell">
              <div className="quote-shell__form">
                <QuoteFlow />
              </div>
            </div>

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
