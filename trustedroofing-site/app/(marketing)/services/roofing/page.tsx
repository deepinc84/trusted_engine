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
  title: "Roofing Services Calgary | Replacement, Repair & Inspections",
  description: "Calgary roofing services for roof replacement, roof repair, inspections, maintenance, storm damage, and instant online roof estimates.",
  path: "/services/roofing"
});

function isRoofingQuote(quote: Awaited<ReturnType<typeof getAllQuoteCards>>[number]) {
  const haystack = `${quote.material} ${quote.serviceType ?? ""} ${(quote.requestedScopes ?? []).join(" ")}`.toLowerCase();
  return haystack.includes("roof") || haystack.includes("shingle");
}

export default async function RoofingPage() {
  const [geoPosts, quoteCards] = await Promise.all([
    listGeoPosts(null, { serviceSlugs: ["roofing", "roof-repair", "roof-replacement", "shingles"] }),
    getAllQuoteCards()
  ]);
  const roofingQuotes = quoteCards.filter(isRoofingQuote).slice(0, 3);

  return (
    <>
      <ServiceSchema serviceName="Roofing Services" serviceSlug="roofing" serviceType="Roofing" />
      <PageHero
        eyebrow="Roofing services Calgary"
        title="Roofing Services in Calgary"
        description="Calgary roofs deal with hail, wind, sun, freeze-thaw cycles, and ventilation pressure. Start here to choose between roof replacement, roof repair, or roof inspection and maintenance before moving into an instant roof estimate."
        actions={<Link href="/online-estimate" className="button">Get instant roof quote</Link>}
      />

      <section className="ui-page-section">
        <PageContainer>
          <div className="ui-grid ui-grid--services">
            <article className="ui-card">
              <h2>Roof Replacement</h2>
              <p>For full reroofing, asphalt shingle replacement, end-of-life roofs, and larger scopes where targeted repair no longer makes sense.</p>
              <Link href="/services/roof-replacement" className="button button--ghost">Explore roof replacement</Link>
            </article>
            <article className="ui-card">
              <h2>Roof Repair</h2>
              <p>For leaks, missing shingles, storm damage, flashing problems, vents, and localized issues that can be corrected without replacing the full roof.</p>
              <Link href="/services/roof-repair" className="button button--ghost">Explore roof repair</Link>
            </article>
            <article className="ui-card">
              <h2>Roof Inspection & Maintenance</h2>
              <p>For condition checks, storm inspections, leak-risk reviews, seasonal maintenance, and repair planning before small issues become larger ones.</p>
              <Link href="/services/roof-inspection-maintenance" className="button button--ghost">Explore inspections</Link>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section ui-page-section--soft">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>Calgary roofing weather context</h2>
              <p>Hail can bruise shingles before a leak appears. Wind-driven rain tests flashing, valleys, wall transitions, skylights, and vents. Freeze-thaw cycles can build ice at the eaves, while summer sun and attic heat can shorten roof life from the inside.</p>
            </article>
            <article className="ui-card">
              <h2>Helpful next steps</h2>
              <p>Compare recent <Link href="/projects">roofing projects</Link>, review local <Link href="/quotes">roof quote signals</Link>, check active <Link href="/service-areas">service areas</Link>, or go straight to the <Link href="/online-estimate">online roof estimate</Link>.</p>
              <p><Link href="/online-estimate" className="button">Get instant roof quote</Link></p>
            </article>
          </div>
        </PageContainer>
      </section>

      {roofingQuotes.length > 0 ? (
        <section className="ui-page-section">
          <PageContainer>
            <article className="ui-card">
              <h2>Recent roofing quote activity</h2>
              <div className="ui-grid ui-grid--services">
                {roofingQuotes.map((quote) => <QuoteCard key={quote.id} quote={quote} variant="compact" />)}
              </div>
            </article>
          </PageContainer>
        </section>
      ) : null}

      <CtaBand
        title="Need a roofing price before a site visit?"
        body="Start with an instant roof quote, then narrow the scope around replacement, repair, inspection findings, materials, and ventilation."
        primaryLabel="Get instant roof quote"
      />
      <ServiceGeoPosts geoPosts={geoPosts} heading="Recent roofing projects in Calgary" />
    </>
  );
}
