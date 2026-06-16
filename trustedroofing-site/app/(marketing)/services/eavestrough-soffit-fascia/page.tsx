import Link from "next/link";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import ServiceSchema from "@/components/ServiceSchema";
import ServiceGeoPosts from "@/components/ServiceGeoPosts";
import { listGeoPosts } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Eavestrough, Soffit & Fascia Calgary | Trusted",
  description: "Compare eavestrough, soffit, fascia, and roofline exterior work for Calgary homes, then start an instant exterior estimate online.",
  path: "/services/eavestrough-soffit-fascia"
});

export default async function EavestroughSoffitFasciaPage() {
  const geoPosts = await listGeoPosts(6, { serviceSlugs: ["gutters", "eavestrough", "soffit-fascia", "downspout", "drainage"] });

  return (
    <>
      <ServiceSchema serviceName="Eavestrough, Soffit and Fascia Services" serviceSlug="eavestrough-soffit-fascia" serviceType="Exterior roofline service" />
      <PageHero
        eyebrow="Roofline exterior services"
        title="Eavestrough, Soffit & Fascia Services in Calgary"
        description="Eavestrough, soffit, and fascia work together to move water away from the house, ventilate the roof edge, and protect exposed roofline details from Calgary weather. This is sometimes called soft metal exteriors in the trade, but homeowners usually experience it as drainage, ventilation, and roofline protection."
        actions={<Link href="/online-estimate" className="button">Get instant exterior estimate</Link>}
      />

      <section className="ui-page-section">
        <PageContainer>
          <div className="ui-grid ui-grid--services">
            <article className="ui-card">
              <h2>Eavestrough</h2>
              <p>Eavestrough and gutters collect roof runoff and direct it through downspouts so water is not dumped against siding, walks, landscaping, or the foundation.</p>
              <Link href="/services/eavestrough" className="button button--ghost">Explore eavestrough</Link>
            </article>
            <article className="ui-card">
              <h2>Soffit</h2>
              <p>Soffit closes the underside of the roof overhang and helps ventilate the attic when intake airflow is planned correctly.</p>
              <Link href="/services/soffit-fascia" className="button button--ghost">Explore soffit & fascia</Link>
            </article>
            <article className="ui-card">
              <h2>Fascia</h2>
              <p>Fascia protects the exposed roof edge, gives the eavestrough a solid mounting surface, and finishes the roofline visually.</p>
              <Link href="/services/soffit-fascia" className="button button--ghost">Review fascia details</Link>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section ui-page-section--soft">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>Drainage, ventilation, and roofline protection</h2>
              <p>These components should not be treated as separate decorations. Eavestrough handles runoff, soffit supports airflow, and fascia ties the roof edge together. When one part fails, water can stain siding, rot roofline wood, overload fasteners, or create ice near entries and walkways.</p>
            </article>
            <article className="ui-card">
              <h2>Calgary weather context</h2>
              <p>Freeze-thaw cycles, hail, wind, chinooks, and sudden spring melt all stress the roof edge. Proper slope, outlet placement, ventilation openings, fastener support, and clean transitions matter as much as the visible metal finish.</p>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section">
        <PageContainer>
          <article className="ui-card">
            <h2>Start with the issue you are seeing</h2>
            <p>Overflowing troughs, loose downspouts, peeling roofline paint, animal entry points, and poor attic airflow can all point back to this system. Start with an online estimate and we can narrow the scope to eavestrough, soffit, fascia, or a combined roofline repair.</p>
            <Link href="/online-estimate" className="button">Get instant exterior estimate</Link>
          </article>
        </PageContainer>
      </section>

      <CtaBand
        title="Need roofline exterior pricing?"
        body="Start an instant exterior estimate for eavestrough, soffit, fascia, drainage, and related roofline details."
        primaryLabel="Get instant exterior estimate"
      />
      <ServiceGeoPosts geoPosts={geoPosts} heading="Recent roofline exterior projects in Calgary" />
    </>
  );
}
