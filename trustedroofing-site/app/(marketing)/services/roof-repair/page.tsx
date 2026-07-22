import Link from "next/link";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import ServiceSchema from "@/components/ServiceSchema";
import ServiceGeoPosts from "@/components/ServiceGeoPosts";
import { listGeoPosts } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Roof Repair Calgary | Leak, Wind & Hail Repairs",
  description: "Calgary roof repair for leaks, missing shingles, storm damage, flashing issues, vents, and targeted roofing fixes with online estimate options.",
  path: "/services/roof-repair"
});

const repairItems = [
  "roof leak repair and water-entry tracing",
  "missing, lifted, or damaged shingles",
  "hail and wind damage repairs",
  "flashing repairs at walls, chimneys, skylights, and valleys",
  "vent, pipe boot, and roof accessory issues",
  "targeted maintenance fixes before they become interior damage"
];

export default async function RoofRepairPage() {
  const geoPosts = await listGeoPosts(null, { serviceSlugs: ["roofing", "roof-repair", "shingles"] });

  return (
    <>
      <ServiceSchema serviceName="Roof Repair" serviceSlug="roof-repair" serviceType="Roof repair" />
      <PageHero
        eyebrow="Roof repair Calgary"
        title="Calgary Roof Repair for Leaks, Wind and Storm Damage"
        description="Roof repair is for leaks, storm damage, missing shingles, flashing problems, vent issues, and targeted fixes where the rest of the roof may still have life left. The goal is to find the failure point and explain whether repair is enough."
        actions={<Link href="/online-estimate" className="button">Get instant roof repair estimate</Link>}
      />

      <section className="ui-page-section">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>Repair focus</h2>
              <ul>{repairItems.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
            <article className="ui-card">
              <h2>Leak, storm, and accessory repairs</h2>
              <p>Water often enters around transitions, penetrations, valleys, vents, and flashing before a homeowner sees a ceiling stain. Hail and wind can also loosen shingles, expose fasteners, damage roof accessories, or create weak points that show up later during heavy weather.</p>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section ui-page-section--soft">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>When repair is enough</h2>
              <p>Repair may be the right move when the issue is localized, the shingles still have usable life, matching material is available, and the roof deck and ventilation do not show broader failure signs.</p>
            </article>
            <article className="ui-card">
              <h2>When replacement should be considered</h2>
              <p>Replacement may be more responsible when repairs are stacking up, shingles are brittle or heavily granule-worn, storm damage is widespread, decking is compromised, or ventilation and flashing problems are part of a larger roof system failure.</p>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>Common Calgary roof repair calls</h2>
              <p>Repair requests often start with one visible symptom: a ceiling stain after a thaw, shingles on the lawn after a wind event, lifted tabs, exposed nails, loose flashing, cracked pipe boots, blocked exhaust vents, or hail bruising that needs documentation before it becomes a larger leak.</p>
            </article>
            <article className="ui-card">
              <h2>Recent repair proof by neighbourhood</h2>
              <p>Use local repair examples to compare the kind of work homeowners are requesting in <Link href="/service-areas/bowness">Bowness</Link>, <Link href="/service-areas/harvest-hills">Harvest Hills</Link>, <Link href="/service-areas/evanston">Evanston</Link>, and <Link href="/service-areas/oakridge">Oakridge</Link>, then move from the neighbourhood context to a specific repair estimate.</p>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section">
        <PageContainer>
          <article className="ui-card">
            <h2>Compare roofing paths</h2>
            <p>Start with the <Link href="/services/roofing">roofing services hub</Link> if you are unsure, compare full <Link href="/services/roof-replacement">roof replacement</Link>, or use <Link href="/services/roof-inspection-maintenance">roof inspection and maintenance</Link> if you need a condition review before deciding.</p>
            <p><Link href="/online-estimate" className="button">Get instant roof repair estimate</Link></p>
          </article>
        </PageContainer>
      </section>

      <CtaBand
        title="Need targeted roof repair pricing?"
        body="Start with an instant estimate and we can triage leak, storm, flashing, shingle, or roof accessory issues quickly."
        primaryLabel="Get instant roof repair estimate"
      />
      <ServiceGeoPosts geoPosts={geoPosts} heading="Recent roof repair jobs in Calgary" />
    </>
  );
}
