import QuoteApplicationSchema from "@/components/QuoteApplicationSchema";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import QuoteFlow from "@/components/QuoteFlow";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Instant quote",
  description: "Anonymous instant roofing, siding, and eavestrough estimates for Calgary homeowners.",
  path: "/quote"
});

export default function QuotePage() {
  return (
    <>
      <QuoteApplicationSchema />
      <PageHero
        eyebrow="Instant quote"
        title="Get your estimate in minutes"
        description="Address autocomplete, roof-data pricing, and nearby project proof in one flow."
      />
      <section className="ui-page-section ui-page-section--soft">
        <PageContainer>
          <div className="quote-shell">
            <div className="quote-shell__form">
              <QuoteFlow />
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
