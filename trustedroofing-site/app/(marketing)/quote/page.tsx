import FaqAccordion from "@/components/FaqAccordion";
import QuoteApplicationSchema, { quoteFaqItems } from "@/components/QuoteApplicationSchema";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
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

export default function QuotePage() {
  return (
    <>
      <QuoteApplicationSchema />
      <section className="ui-page-section ui-page-section--soft">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>Why this quote tool is different</h2>
              <p>Most online roofing calculators are little more than a form wrapped around a weak average. They ask for a postal code, ignore roof complexity, and spit back a number that feels precise but does not help a homeowner make a real decision. That is not what this tool is for.</p>
              <p>This estimate flow was built around real completed projects and real quote history. It looks at property size, roof pitch, complexity, and location context before it gives a range. In practical terms, that means a steeper roof in one part of Calgary should not be treated the same way as a simple low-complexity home in another area. The tool is designed to reflect that.</p>
              <p>It also helps homeowners compare scope before an inspection. You can look at roofing on its own, price out siding options, or see what eavestrough work does to the range. That makes the next conversation more useful because you are no longer guessing from scratch. You have a number grounded in real work, not a generic marketing funnel.</p>
              <p>The result is a realistic planning range in under 60 seconds. It is still a starting point. Site review matters. Material choice matters. Ventilation issues, access, tear-off conditions, and hidden repairs still need to be confirmed. But if you want an honest first step, this tool gets you there much faster than waiting days for basic budget guidance.</p>
            </article>
            <div className="quote-shell"><div className="quote-shell__form"><QuoteFlow /></div></div>
          </div>
        </PageContainer>
      </section>
      <section className="ui-page-section">
        <PageContainer>
          <div className="quote-support-stack">
            <article className="ui-card quote-support-card">
              <p className="ui-page-hero__eyebrow">How it works</p>
              <h2>Everything after the tool stays below the estimator</h2>
              <p>
                The instant quote stays front-and-center. Supporting guidance, expectations, and FAQs are placed
                underneath it so the estimator remains fully visible and usable.
              </p>
              <div className="ui-grid ui-grid--services quote-support-grid">
                {quoteBenefits.map((benefit) => (
                  <article key={benefit.title} className="ui-card">
                    <h3>{benefit.title}</h3>
                    <p>{benefit.body}</p>
                  </article>
                ))}
              </div>
            </article>

            <article className="ui-card quote-support-card">
              <p className="ui-page-hero__eyebrow">FAQ</p>
              <h2>Instant quote questions</h2>
              <div className="quote-faq-list">
                {quoteFaqItems.map((item) => (
                  <details key={item.question} className="quote-faq-item">
                    <summary>{item.question}</summary>
                    <p>{item.answer}</p>
                  </details>
                ))}
              </div>
            </article>
          </div>
        </PageContainer>
      </section>
      <section className="ui-page-section">
        <PageContainer>
          <div className="quote-support-stack">
            <article className="ui-card quote-support-card">
              <p className="ui-page-hero__eyebrow">How it works</p>
              <h2>Everything after the tool stays below the estimator</h2>
              <p>
                The instant quote stays front-and-center. Supporting guidance, expectations, and FAQs are placed
                underneath it so the estimator remains fully visible and usable.
              </p>
              <div className="ui-grid ui-grid--services quote-support-grid">
                {quoteBenefits.map((benefit) => (
                  <article key={benefit.title} className="ui-card">
                    <h3>{benefit.title}</h3>
                    <p>{benefit.body}</p>
                  </article>
                ))}
              </div>
            </article>

            <article className="ui-card quote-support-card">
              <p className="ui-page-hero__eyebrow">FAQ</p>
              <h2>Instant quote questions</h2>
              <FaqAccordion items={quoteFaqItems} />
            </article>
          </div>
        </PageContainer>
      </section>
      <PageHero
        eyebrow="Instant quote"
        title="Get your estimate in minutes"
        description="Address autocomplete, roof-data pricing, and nearby project proof in one flow."
      />
      <section className="ui-page-section">
        <PageContainer>
          <div className="quote-support-stack">
            <article className="ui-card quote-support-card">
              <p className="ui-page-hero__eyebrow">How it works</p>
              <h2>Everything after the tool stays below the estimator</h2>
              <p>
                The instant quote stays front-and-center. Supporting guidance, expectations, and FAQs are placed
                underneath it so the estimator remains fully visible and usable.
              </p>
              <div className="ui-grid ui-grid--services quote-support-grid">
                {quoteBenefits.map((benefit) => (
                  <article key={benefit.title} className="ui-card">
                    <h3>{benefit.title}</h3>
                    <p>{benefit.body}</p>
                  </article>
                ))}
              </div>
            </article>

            <article className="ui-card quote-support-card">
              <p className="ui-page-hero__eyebrow">FAQ</p>
              <h2>Instant quote questions</h2>
              <FaqAccordion items={quoteFaqItems} />
            </article>
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
