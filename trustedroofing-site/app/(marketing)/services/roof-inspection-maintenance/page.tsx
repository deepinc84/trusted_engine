import Link from "next/link";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import ServiceSchema from "@/components/ServiceSchema";
import ServiceGeoPosts from "@/components/ServiceGeoPosts";
import { listGeoPosts } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Roof Inspection & Maintenance Calgary | Trusted",
  description: "Roof inspection and maintenance services for Calgary homes, including condition checks, storm inspections, leak prevention, and repair planning.",
  path: "/services/roof-inspection-maintenance"
});

const inspectionItems = [
  "roof condition assessments",
  "hail and storm damage inspections",
  "preventative roof maintenance",
  "seasonal roof checks",
  "leak-risk review",
  "flashing, vents, sealant, and drainage checks"
];

export default async function RoofInspectionMaintenancePage() {
  const geoPosts = await listGeoPosts(6, { serviceSlugs: ["roofing", "roof-repair", "roof-replacement", "shingles"] });

  return (
    <>
      <ServiceSchema serviceName="Roof Inspection and Maintenance" serviceSlug="roof-inspection-maintenance" serviceType="Roof inspection and maintenance" />
      <PageHero
        eyebrow="Roof inspection and maintenance Calgary"
        title="Roof Inspection and Maintenance in Calgary"
        description="Roof inspection and maintenance helps homeowners understand roof condition, storm damage risk, leak potential, and whether the next step should be repair, replacement, or preventative upkeep."
        actions={<Link href="/online-estimate" className="button">Start roof estimate</Link>}
      />

      <section className="ui-page-section">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>What inspections and maintenance include</h2>
              <ul>{inspectionItems.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
            <article className="ui-card">
              <h2>Storm and seasonal checks</h2>
              <p>After hail, wind, chinooks, or freeze-thaw swings, a roof can show subtle damage before it leaks. Seasonal checks look at shingles, exposed fasteners, flashings, valleys, vents, pipe boots, sealant, roof edges, and drainage patterns.</p>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section ui-page-section--soft">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>Leak-risk and drainage review</h2>
              <p>Inspection work should look beyond the visible shingle field. Flashing, vents, sealant, valleys, skylights, eaves, downspouts, and drainage paths all influence whether water is moved away from vulnerable roof and wall details.</p>
            </article>
            <article className="ui-card">
              <h2>Repair vs replacement planning</h2>
              <p>An inspection may lead to a targeted repair when the issue is isolated. It may lead to replacement planning when wear, storm damage, ventilation problems, or repeated repairs show the roof system is reaching the end of its useful life.</p>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section">
        <PageContainer>
          <article className="ui-card">
            <h2>Choose the right roofing next step</h2>
            <p>Use the <Link href="/services/roofing">roofing services hub</Link> to compare options, review <Link href="/services/roof-repair">roof repair</Link> if the issue is targeted, or compare <Link href="/services/roof-replacement">roof replacement</Link> if the roof is near the end of its service life.</p>
            <p><Link href="/online-estimate" className="button">Start roof estimate</Link></p>
          </article>
        </PageContainer>
      </section>

      <CtaBand
        title="Need a roof condition starting point?"
        body="Start with an instant estimate, then use inspection findings to decide whether maintenance, repair, or replacement makes sense."
        primaryLabel="Start roof estimate"
      />
      <ServiceGeoPosts geoPosts={geoPosts} heading="Recent roofing inspection and repair context in Calgary" />
    </>
  );
}
