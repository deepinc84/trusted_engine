import Link from "next/link";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import ServiceSchema from "@/components/ServiceSchema";
import ServiceGeoPosts from "@/components/ServiceGeoPosts";
import { listGeoPosts } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Siding Services Calgary | Vinyl & Hardie Options",
  description: "Compare vinyl siding and James Hardie siding options for Calgary homes, then start an instant exterior estimate when you are ready.",
  path: "/services/siding"
});

export default async function SidingServicesPage() {
  const geoPosts = await listGeoPosts(null, { serviceSlugs: ["siding", "vinyl-siding", "james-hardie-siding", "hardie-board-siding"] });

  return (
    <>
      <ServiceSchema serviceName="Siding Services" serviceSlug="siding" serviceType="Siding contractor" />
      <PageHero
        eyebrow="Siding services Calgary"
        title="Siding Services in Calgary: Vinyl and James Hardie Options"
        description="Siding replacement protects the wall assembly, improves curb appeal, and gives Calgary homeowners a chance to correct weak trim, flashing, and moisture details before they become bigger problems. Compare vinyl and James Hardie before choosing the right exterior path."
        actions={<Link href="/online-estimate" className="button">Get instant exterior estimate</Link>}
      />

      <section className="ui-page-section">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>Vinyl siding</h2>
              <p>Vinyl siding is often the practical choice when you want a clean exterior upgrade, controlled pricing, and straightforward colour and profile options. It works well when the wall can be detailed properly without pushing the project into a heavier cladding system.</p>
              <Link href="/services/vinyl-siding" className="button button--ghost">Explore vinyl siding</Link>
            </article>
            <article className="ui-card">
              <h2>James Hardie siding</h2>
              <p>James Hardie fiber cement siding is usually chosen when homeowners want a more substantial wall finish, stronger shadow lines, and a more architectural look. It costs more to install, so the house, budget, and finish goals should justify the upgrade.</p>
              <Link href="/services/james-hardie-siding" className="button button--ghost">James Hardie siding options</Link>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section ui-page-section--soft">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>Siding price factors</h2>
              <p>Calgary siding pricing depends on wall area, height, access, old cladding removal, trim package, window and door detailing, housewrap condition, and whether hidden repairs are needed once the wall is opened.</p>
              <ul>
                <li>Standard vinyl usually keeps scope and budget tighter.</li>
                <li>Premium vinyl adds profile depth and a heavier finished appearance.</li>
                <li>James Hardie adds material weight, cutting, fastening, clearances, and trim labour.</li>
              </ul>
            </article>
            <article className="ui-card">
              <h2>Calgary weather, hail, and exposure</h2>
              <p>South and west elevations often weather faster from sun and wind. Hail can damage lightweight panels and trim, while freeze-thaw movement exposes weak joints and flashing. Good siding work accounts for wind-driven moisture, roof runoff, and the way soffit, fascia, and eavestrough details tie into the wall.</p>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section">
        <PageContainer>
          <article className="ui-card">
            <h2>Which siding option makes sense?</h2>
            <p>Choose vinyl when budget control, clean curb appeal, and practical replacement are the priority. Choose James Hardie when the finished look, wall rigidity, and long-term exterior presentation are worth the extra install cost.</p>
            <p>If you are still unsure, start with an online exterior estimate and use the result to compare the two siding paths against the actual size and scope of your home.</p>
            <Link href="/online-estimate" className="button">Get instant exterior estimate</Link>
          </article>
        </PageContainer>
      </section>

      <CtaBand
        title="Ready to compare siding options?"
        body="Start an instant exterior estimate, then narrow the scope around vinyl, James Hardie, trim, and wall condition."
        primaryLabel="Get instant exterior estimate"
      />
      <ServiceGeoPosts geoPosts={geoPosts} heading="Recent siding projects in Calgary" />
    </>
  );
}
