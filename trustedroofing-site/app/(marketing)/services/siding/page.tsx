import Link from "next/link";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import ServiceSchema from "@/components/ServiceSchema";
import { buildMetadata } from "@/lib/seo";

const options = [
  "Standard vinyl siding for clean curb appeal and practical budget control.",
  "Premium vinyl profiles when a heavier look and stronger finish package are the priority.",
  "Royal Building Products, Mitten, and Gentek product lines for homeowners who want brand-level comparisons.",
  "Trim, starter, corners, housewrap review, and detailing around windows, doors, soffit, and fascia."
];

const faqs = [
  { question: "How much does siding replacement cost in Calgary?", answer: "It depends on wall area, trim complexity, existing wall condition, insulation or wrap corrections, and the material tier you choose. Standard vinyl and premium vinyl do not carry the same cost, and details around openings can change labour time more than people expect." },
  { question: "What is the difference between standard and premium vinyl siding?", answer: "Standard vinyl is often the most budget-conscious route for a clean refresh. Premium vinyl usually offers heavier profiles, deeper shadow lines, stronger curb appeal, and in some cases better resistance to waviness or visual movement." },
  { question: "Can siding help with moisture issues?", answer: "Siding alone is not the fix if the wall assembly behind it is compromised, but replacement is the right time to correct housewrap, flashing, and trim details that let water or air get behind the cladding." },
  { question: "Can siding be replaced in winter?", answer: "Some exterior work can move ahead in colder months, but material handling, cutting conditions, sealants, and weather windows matter. The practical question is whether the install can be done cleanly and safely, not just whether it is technically possible." },
  { question: "Which siding brands do you install?", answer: "We commonly discuss Royal Building Products, Mitten, and Gentek because homeowners want a clear comparison of profile, finish, and price. The right fit depends on design goals and what the house needs, not just a brand name." },
  { question: "How do I know if my siding needs replacement or just repair?", answer: "If damage is limited and matching material is available, a repair can make sense. If panels are brittle, repeatedly loose, faded beyond a practical match, or the wall detailing is causing moisture issues, replacement is often the smarter route." }
];

export const metadata = buildMetadata({
  title: "Siding",
  description: "Calgary siding replacement and exterior cladding upgrades with clear material guidance, moisture-aware detailing, and practical homeowner planning.",
  path: "/services/siding"
});

export default function SidingPage() {
  return (
    <>
      {/* Schema note: this page should use one primary Service schema for siding. */}
      <ServiceSchema serviceName="Siding" serviceType="Siding contractor" />
      <PageHero
        eyebrow="Siding service"
        title="Siding work that improves both protection and appearance"
        description="New siding should not just hide an old wall. It should improve water control, sharpen the finish around openings and trim, and stand up to Calgary wind, sun, and temperature swings."
        actions={<Link href="/quote" className="button">Start instant quote</Link>}
      />

      <section className="ui-page-section">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>What this service includes</h2>
              <p>
                Siding work starts with the visible finish, but it should always account for what is happening underneath. We look at the
                condition of the existing cladding, trim, wrap, flashings, and transitions to soffit, fascia, and eavestrough. If water is
                getting behind the wall, simply changing the colour will not solve the real problem.
              </p>
              <ul>{options.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
            <article className="ui-card">
              <h2>When homeowners usually need siding work</h2>
              <p>
                Common triggers include cracked or loose panels, fading that makes patch repairs obvious, recurring wind damage, and trim
                areas that are taking on water. Sometimes the homeowner is mainly after a visual update. Other times the siding project is
                really about fixing weak details around windows, doors, and roof-to-wall junctions before those issues move further into the envelope.
              </p>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section ui-page-section--soft">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>Standard vs premium siding options</h2>
              <p>
                Standard vinyl is often the right answer when the goal is a clean, durable upgrade without pushing the budget beyond reason.
                Premium vinyl earns its place when the homeowner wants a heavier look, better visual depth, and a more elevated finish package.
                The difference is not just cosmetic. Premium options can also feel more stable and substantial on the wall when the profile and
                installation details are chosen properly.
              </p>
              <p>
                We regularly discuss Royal Building Products, Mitten, and Gentek because those are the kinds of comparisons homeowners actually ask for.
                What matters most is how the full system is detailed, especially in a climate where wind-driven moisture can exploit weak trim work quickly.
              </p>
            </article>
            <article className="ui-card">
              <h2>How the process works</h2>
              <ol>
                <li>We identify whether the real issue is cosmetic wear, storm damage, moisture intrusion, or a combination of all three.</li>
                <li>We review material direction and profile options so the budget matches the finish level you want.</li>
                <li>We confirm trim, flashing, and transition details before ordering materials.</li>
                <li>Installation is sequenced so the wall can be properly prepared before the new cladding goes on.</li>
                <li>Final walkthrough focuses on finish quality, alignment, and clean water management details.</li>
              </ol>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section">
        <PageContainer>
          <article className="ui-card">
            <h2>Calgary-specific siding considerations</h2>
            <p>
              Calgary siding takes sun exposure, wind, hail, and fast seasonal changes. Freeze-thaw movement can expose weak joints and trim gaps.
              Wind-driven rain can get behind poorly flashed openings. South and west elevations usually weather faster, and homes with roof runoff issues
              often show that damage on the wall first. Good siding work takes those realities into account instead of treating every wall like a decorative surface.
            </p>
          </article>
        </PageContainer>
      </section>

      <section className="ui-page-section ui-page-section--soft">
        <PageContainer>
          <article className="ui-card">
            <h2>Useful references</h2>
            <p>
              If you want to compare manufacturer lines before your appointment, review
              {" "}<a href="https://www.royalbuildingproducts.com/products/siding" target="_blank" rel="noreferrer">Royal Building Products</a>,
              {" "}<a href="https://www.mittenbp.com/" target="_blank" rel="noreferrer">Mitten</a>, and
              {" "}<a href="https://gentek.ca/" target="_blank" rel="noreferrer">Gentek</a>.
            </p>
          </article>
        </PageContainer>
      </section>

      <section className="ui-page-section">
        <PageContainer>
          <article className="ui-card">
            <h2>Frequently asked questions</h2>
            {/* Schema note: apply FAQ schema to this section only. */}
            <div className="ui-list-links" style={{ display: "grid", gap: 20 }}>
              {faqs.map((item) => <div key={item.question}><h3>{item.question}</h3><p>{item.answer}</p></div>)}
            </div>
          </article>
        </PageContainer>
      </section>

      <CtaBand title="Need siding pricing before you commit to colours and profiles?" body="Use the quote tool first, then we can refine scope, trim, and material level with you." />
    </>
  );
}
