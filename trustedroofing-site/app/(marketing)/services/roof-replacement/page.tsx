import Link from "next/link";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import ServiceSchema from "@/components/ServiceSchema";
import ServiceGeoPosts from "@/components/ServiceGeoPosts";
import QuoteCard from "@/components/QuoteCard";
import { listGeoPosts } from "@/lib/db";
import { getAllQuoteCards } from "@/lib/seo-engine";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Roof Replacement Calgary | Trusted",
  description: "Roof replacement estimates for Calgary homes, including asphalt shingles, roof size, pitch, complexity, materials, and instant online pricing.",
  path: "/services/roof-replacement"
});

const priceFactors = [
  "roof size",
  "roof pitch",
  "roof complexity",
  "number of layers",
  "decking condition",
  "ventilation",
  "material choice",
  "access and disposal"
];

function isRoofReplacementQuote(quote: Awaited<ReturnType<typeof getAllQuoteCards>>[number]) {
  const haystack = `${quote.material} ${quote.serviceType ?? ""} ${(quote.requestedScopes ?? []).join(" ")}`.toLowerCase();
  return haystack.includes("roof") || haystack.includes("shingle");
}

export default async function RoofReplacementPage() {
  const [geoPosts, quoteCards] = await Promise.all([
    listGeoPosts(6, { serviceSlugs: ["roofing", "roof-replacement", "shingles"] }),
    getAllQuoteCards()
  ]);
  const roofQuotes = quoteCards.filter(isRoofReplacementQuote).slice(0, 3);

  return (
    <>
      <ServiceSchema serviceName="Roof Replacement" serviceSlug="roof-replacement" serviceType="Roof replacement" />
      <PageHero
        eyebrow="Roof replacement Calgary"
        title="Roof Replacement in Calgary"
        description="Full roof replacement is for homes where the roof has reached the end of its service life, storm damage is widespread, or repair work would only delay a larger reroofing project. Start with instant pricing, then confirm materials and site details."
        actions={<Link href="/online-estimate" className="button">Get instant roof quote</Link>}
      />

      <section className="ui-page-section">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>Roof replacement overview</h2>
              <p>A replacement scope looks at the whole roof system: tear-off, deck condition, underlayment, valleys, flashings, ventilation, penetrations, ridge details, waste handling, and final cleanup. The goal is not just new shingles; it is a complete roof assembly that fits Calgary exposure.</p>
            </article>
            <article className="ui-card">
              <h2>Asphalt shingle replacement</h2>
              <p>Asphalt shingle systems remain the common residential reroofing choice in Calgary. Material comparisons can include Malarkey and GAF options where appropriate, but the right system still depends on roof shape, exposure, ventilation, and budget.</p>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section ui-page-section--soft">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>Full reroofing process</h2>
              <ol>
                <li>Start with an online roof estimate for an early pricing range.</li>
                <li>Confirm roof measurements, pitch, access, layers, and complexity.</li>
                <li>Review decking, ventilation, flashing, valleys, penetrations, and material options.</li>
                <li>Finalize a written replacement scope before scheduling work.</li>
                <li>Complete tear-off, installation, cleanup, and final roof system review.</li>
              </ol>
            </article>
            <article className="ui-card">
              <h2>Roof replacement price factors</h2>
              <ul>{priceFactors.map((factor) => <li key={factor}>{factor}</li>)}</ul>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>Calgary hail, wind, sun, and freeze-thaw</h2>
              <p>Calgary roofs are exposed to hail impact, strong wind, UV, sudden temperature swings, and winter freeze-thaw patterns. Replacement planning should account for shingle choice, ventilation balance, flashing details, runoff, and roof edge protection.</p>
            </article>
            <article className="ui-card">
              <h2>Compare roofing services</h2>
              <p>Not sure if replacement is the right move? Start with the <Link href="/services/roofing">roofing services hub</Link>, compare targeted <Link href="/services/roof-repair">roof repair</Link>, or use <Link href="/services/roof-inspection-maintenance">roof inspection and maintenance</Link> to assess condition first.</p>
              <p><Link href="/online-estimate" className="button">Get instant roof quote</Link></p>
            </article>
          </div>
        </PageContainer>
      </section>

      {roofQuotes.length > 0 ? (
        <section className="ui-page-section ui-page-section--soft">
          <PageContainer>
            <article className="ui-card">
              <h2>Recent roof replacement quote examples</h2>
              <div className="ui-grid ui-grid--services">
                {roofQuotes.map((quote) => <QuoteCard key={quote.id} quote={quote} variant="compact" />)}
              </div>
            </article>
          </PageContainer>
        </section>
      ) : null}

      <CtaBand
        title="Ready to price a roof replacement?"
        body="Get an instant roof quote, then confirm measurements, layers, materials, ventilation, and access details with the team."
        primaryLabel="Get instant roof quote"
      />
      <ServiceGeoPosts geoPosts={geoPosts} heading="Recent roof replacement projects in Calgary" />
    </>
  );
}
