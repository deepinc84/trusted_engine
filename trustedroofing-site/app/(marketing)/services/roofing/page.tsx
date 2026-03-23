import Link from "next/link";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import ServiceSchema from "@/components/ServiceSchema";
import { buildMetadata } from "@/lib/seo";

const includes = [
  "Full roof replacements with tear-off, deck review, underlayment, flashing, ventilation review, and clean-up.",
  "Material planning around GAF Timberline HD, Malarkey Vista, Malarkey Legacy, and Euroshield rubber roofing systems.",
  "Accessory work where needed, including vents, pipe flashings, drip edge, starter, ridge ventilation, and tie-ins to eavestrough and siding details."
];

const needs = [
  "The roof is nearing the end of its service life and repairs are starting to stack up.",
  "Hail has bruised shingles or knocked granules loose, even if leaks have not started yet.",
  "The attic shows condensation, hot spots, or poor airflow because intake and exhaust ventilation are not balanced.",
  "Flashing, valleys, skylights, or wall transitions are letting in water during heavy wind-driven rain."
];

const faqs = [
  { question: "How much does a roof replacement cost in Calgary?", answer: "It depends on roof size, pitch, layer count, access, ventilation corrections, and the shingle system selected. The instant quote tool is designed to give a realistic range quickly, then the site review confirms the final scope." },
  { question: "How long does an asphalt shingle roof last in Alberta?", answer: "A well-installed roof can last for many years, but Alberta hail, UV exposure, freeze-thaw cycles, and attic heat build-up can shorten service life. Ventilation and flashing details often matter as much as the shingle itself." },
  { question: "Do I need Class 4 shingles in Calgary?", answer: "They are not mandatory on every house, but impact-resistant shingles are worth serious consideration here. Class 3 and Class 4 ratings matter because hail is a real part of the risk profile, and some insurers pay attention to that difference." },
  { question: "What is the difference between Malarkey Vista and Legacy shingles?", answer: "Both are premium laminated shingles, but Legacy is generally positioned as the heavier, more impact-resistant option. Vista is still a strong fit for many homes and budgets. The right choice depends on exposure, budget, and how long you expect to stay in the house." },
  { question: "When does Euroshield make sense instead of asphalt shingles?", answer: "Euroshield can make sense when impact resistance is a top priority, when you want a rubber roofing system with a different performance profile, or when a homeowner plans to stay long term and wants to invest in durability. It is not the right answer for every budget, but it belongs in the comparison." },
  { question: "How long does roof replacement take?", answer: "Many residential roofs are completed within a few working days, but weather, complexity, repairs to the deck, and material lead times can change that. The goal is not just speed. It is finishing the system properly." }
];

export const metadata = buildMetadata({
  title: "Roofing",
  description: "Calgary roofing replacements and system upgrades using practical scope planning, impact-resistant options, and ventilation-aware installation.",
  path: "/services/roofing"
});

export default function RoofingPage() {
  return (
    <>
      {/* Schema note: keep Service schema as the primary schema on this page. Avoid stacking multiple primary schema types. */}
      <ServiceSchema serviceName="Roofing" serviceType="Roofing" />
      <PageHero
        eyebrow="Roofing service"
        title="Roof replacement planning built for Calgary conditions"
        description="A roof system has to do more than look clean from the street. It has to handle hail, wind-driven moisture, freeze-thaw cycles, and attic ventilation pressure without turning small weak points into expensive interior damage."
        actions={<Link href="/quote" className="button">Start instant quote</Link>}
      />

      <section className="ui-page-section">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>What this service includes</h2>
              <p>
                Roofing work here is approached as a system, not a bundle of shingles. We look at the roof covering, underlayment,
                flashings, ventilation path, roof-to-wall transitions, and runoff management together. That matters in Calgary because
                the same storm can bring hail, wind, and temperature swings in a short window.
              </p>
              <ul>{includes.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>

            <article className="ui-card">
              <h2>When homeowners usually need it</h2>
              <ul>{needs.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section ui-page-section--soft">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>Materials and options that matter here</h2>
              <p>
                GAF Timberline HD is a familiar choice when a homeowner wants dependable laminated shingles from a major manufacturer.
                Malarkey Vista is often part of the conversation when someone wants a stronger step up in impact resistance. Malarkey
                Legacy belongs in the comparison when hail exposure and long-term durability are priorities. Euroshield is a different
                category altogether. It is a rubber roofing system that makes sense on certain homes where impact resistance and lifecycle
                value outweigh the higher initial investment.
              </p>
              <p>
                Class 3 and Class 4 ratings matter in Alberta because hail is not a theoretical risk. The practical question is not whether
                a premium shingle sounds impressive. It is whether the roof you choose is appropriate for the house, the neighborhood exposure,
                and the insurance conversation you may have after the next storm season.
              </p>
            </article>

            <article className="ui-card">
              <h2>How the process works</h2>
              <ol>
                <li>We start with an instant range so you have a real budget direction before inspection.</li>
                <li>On site, we review access, measurements, ventilation, flashing details, and any signs of deck or moisture issues.</li>
                <li>We compare material options with plain language, not vague upselling.</li>
                <li>The final scope is written clearly so you know what is being replaced, corrected, or left alone.</li>
                <li>Installation is scheduled around weather windows, material readiness, and site protection needs.</li>
              </ol>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section">
        <PageContainer>
          <article className="ui-card">
            <h2>Calgary-specific roofing considerations</h2>
            <p>
              Roofs here deal with rapid weather changes. A warm Chinook period can start snow melt, then a hard drop in temperature can
              refreeze water at the eaves. Hail can damage the shingle surface long before a leak shows up indoors. Poor attic ventilation
              can trap heat and moisture, which shortens roof life from the inside. Wind-driven rain tests every flashing point, especially
              around walls, chimneys, vents, skylights, and valleys. Good roofing work in Calgary is about managing those combined pressures,
              not simply swapping old shingles for new ones.
            </p>
          </article>
        </PageContainer>
      </section>

      <section className="ui-page-section ui-page-section--soft">
        <PageContainer>
          <article className="ui-card">
            <h2>Useful references</h2>
            <p>
              Review the manufacturer information for
              {" "}<a href="https://www.gaf.ca/residential-roofing/shingles/timberline-hd" target="_blank" rel="noreferrer">GAF Timberline HD</a>,
              {" "}<a href="https://malarkeyroofing.com/products/shingles/vista" target="_blank" rel="noreferrer">Malarkey Vista</a>, and
              {" "}<a href="https://www.euroshieldroofing.com/" target="_blank" rel="noreferrer">Euroshield</a>
              {" "}if you want to compare product categories before your site visit.
            </p>
          </article>
        </PageContainer>
      </section>

      <section className="ui-page-section">
        <PageContainer>
          <article className="ui-card">
            <h2>Frequently asked questions</h2>
            {/* Schema note: apply FAQ schema to this section only, and keep the page's main schema focused on the roofing service. */}
            <div className="ui-list-links" style={{ display: "grid", gap: 20 }}>
              {faqs.map((item) => (
                <div key={item.question}><h3>{item.question}</h3><p>{item.answer}</p></div>
              ))}
            </div>
          </article>
        </PageContainer>
      </section>

      <CtaBand title="Want a realistic roofing range before a site visit?" body="Use the instant quote tool, then we can confirm ventilation, material, and flashing details on site." />
    </>
  );
}
