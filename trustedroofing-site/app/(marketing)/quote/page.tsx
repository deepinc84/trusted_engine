import FaqAccordion from "@/components/FaqAccordion";
import QuoteApplicationSchema, { quoteFaqItems } from "@/components/QuoteApplicationSchema";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import QuoteFlow from "@/components/QuoteFlow";
import { buildMetadata } from "@/lib/seo";

const quoteBenefits = [
  {
    title: "Start with the estimate first",
    body: "Use the address lookup and scope selector to see a planning range before you commit to a call."
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
  description: "Anonymous instant roofing, siding, and eavestrough estimates for Calgary homeowners.",
  path: "/quote"
});

export const dynamic = "force-dynamic";

export default function QuotePage() {
  return (
    <>
      <QuoteApplicationSchema />
      <section className="ui-page-hero">
        <PageContainer>
          <p className="homev3-eyebrow homev3-eyebrow--dark">Instant quote</p>
          <h1 className="homev3-title">Get your estimate in minutes</h1>
          <p className="homev3-copy">
            Address autocomplete, roof-data pricing, and nearby project proof in one flow.
          </p>
        </PageContainer>
      </section>
      <section className="ui-page-section ui-page-section--soft">
        <PageContainer>
          <div className="quote-page-stack">
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
