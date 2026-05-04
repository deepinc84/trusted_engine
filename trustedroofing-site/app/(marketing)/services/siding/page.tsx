import Link from "next/link";
import CtaBand from "@/components/ui/CtaBand";
import FaqAccordion from "@/components/FaqAccordion";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import ServiceSchema from "@/components/ServiceSchema";
import ServiceGeoPosts from "@/components/ServiceGeoPosts";
import { listGeoPosts } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Vinyl Siding Service",
  description: "Vinyl siding replacement and upgrade work in Calgary with attention to trim, flashing, moisture control, and clean finish details.",
  path: "/services/siding"
});

const vinylFaqItems = [
  {
    question: "How much does vinyl siding cost in Calgary?",
    answer:
      "Cost depends on wall area, trim complexity, existing wall condition, and whether you are comparing standard or premium profiles. Window, door, and roof-to-wall details often change labour more than homeowners expect."
  },
  {
    question: "What affects siding replacement cost in Calgary the most?",
    answer:
      "The biggest cost drivers are access, wall height, trim package, old cladding removal, and the amount of repair needed behind the siding. If the wrap, flashings, or transitions are weak, the project scope usually grows for a good reason."
  },
  {
    question: "What is the difference between standard and premium vinyl siding?",
    answer:
      "Standard vinyl is usually the practical choice for a clean upgrade at a controlled budget. Premium profiles give you a heavier look, deeper shadow lines, and a more finished appearance when the homeowner wants the wall to read stronger from the street."
  },
  {
    question: "Can vinyl siding handle Calgary weather?",
    answer:
      "Yes, if it is installed properly. Panels need room for movement, fasteners need to be set correctly, and the trim and flashing details have to manage wind-driven moisture instead of trapping it."
  },
  {
    question: "Can siding replacement help with moisture issues?",
    answer:
      "Replacement is the right time to correct wrap, flashing, and trim issues that let moisture get behind the wall. New siding alone is not the fix if the water-management details underneath are still wrong."
  },
  {
    question: "How do I know if I need siding repair or full replacement?",
    answer:
      "If the damage is isolated and the material still matches, repair may be enough. If the siding is brittle, faded, repeatedly coming loose, or surrounded by weak trim details, replacement is usually the better call."
  }
] as const;

function buildVinylFaqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: vinylFaqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}

export default async function VinylSidingPage() {
  const geoPosts = await listGeoPosts(6, { serviceSlugs: ["siding", "james-hardie-siding", "vinyl-siding", "hardie-board-siding"] });


  const faqSchema = buildVinylFaqSchema();

  return (
    <>
      {/* Service schema is handled by ServiceSchema. FAQ schema is emitted once below. Do not duplicate the Service schema here. */}
      <ServiceSchema serviceName="Vinyl Siding Service" serviceSlug="siding" serviceType="Vinyl siding" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <PageHero
        eyebrow="Vinyl siding service"
        title="Siding work that improves both protection and appearance"
        description="New siding should not just hide an old wall. It should improve water control, sharpen the finish around openings and trim, and stand up to Calgary wind, sun, and temperature swings."
        actions={<Link href="/online-estimate" className="button">Start instant quote</Link>}
      />



      <section className="ui-page-section">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>What this service includes</h2>
              <p>
                Vinyl siding work starts with the visible finish, but it should always account for what is happening
                underneath. We look at the condition of the existing cladding, trim, wrap, flashings, and transitions
                to soffit, fascia, and eavestrough. If moisture is getting behind the wall, simply changing the colour
                will not solve the real problem.
              </p>
              <ul>
                <li>Standard vinyl siding for clean curb appeal and practical budget control</li>
                <li>Premium vinyl profiles when a heavier look and stronger finish package are the priority</li>
                <li>Royal Building Products, Mitten, and Gentek product lines for homeowners who want brand-level comparisons</li>
                <li>Trim, starter, corners, housewrap review, and detailing around windows, doors, soffit, and fascia</li>
              </ul>
            </article>

            <article className="ui-card">
              <h2>When homeowners usually need vinyl siding work</h2>
              <p>
                Common triggers include cracked or loose panels, fading that makes patch repairs obvious, recurring wind
                damage, and trim areas that are taking on moisture. Sometimes the goal is mainly visual. Other times the
                siding project is really about correcting weak details around windows, doors, and roof-to-wall transitions
                before those issues move further into the wall.
              </p>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section ui-page-section--soft">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>Standard vs premium vinyl siding options</h2>
              <p>
                Standard vinyl is often the right answer when the goal is a clean, durable upgrade without pushing the
                project outside a reasonable range. Premium vinyl earns its place when the homeowner wants a heavier look,
                better visual depth, and a more finished appearance.
              </p>
              <p>
                The difference is not just cosmetic. Premium options tend to feel more stable on the wall when the profile
                and installation are handled correctly.
              </p>
              <p>
                We regularly discuss Royal Building Products, Mitten, and Gentek because those are the comparisons
                homeowners actually ask for. What matters most is how the full system is detailed, especially in a climate
                where wind-driven moisture can expose weak trim work quickly.
              </p>
            </article>

            <article className="ui-card">
              <h2>When vinyl is the right direction</h2>
              <p>
                Vinyl siding is usually the better fit when the goal is to improve the exterior without turning the project
                into a full redesign. It allows for a clean finish, consistent colour, and reliable performance while
                keeping the scope and cost under control.
              </p>
              <p>
                Homeowners usually end up comparing budget, wall condition, and the finished look. If you want the heavier
                fiber cement option, review <Link href="/services/james-hardie-siding">James Hardie siding Calgary</Link>.
                If budget control matters more, the vinyl siding page breaks down where that system usually makes more sense.
              </p>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>How the process works</h2>
              <ol>
                <li>We identify whether the issue is cosmetic wear, storm damage, moisture intrusion, or a combination.</li>
                <li>We review material direction and profile options so the scope matches your budget.</li>
                <li>We confirm trim, flashing, and transition details before materials are ordered.</li>
                <li>Installation is sequenced so the wall is properly prepared before new siding goes on.</li>
                <li>Final walkthrough focuses on finish quality, alignment, and clean water-management details.</li>
              </ol>
            </article>

            <article className="ui-card">
              <h2>Calgary-specific siding considerations</h2>
              <p>
                Calgary siding deals with sun exposure, wind, hail, and rapid seasonal changes. Freeze-thaw movement can
                expose weak joints and trim gaps. Wind-driven moisture can get behind poorly flashed openings. South and
                west elevations typically weather faster, and roof runoff issues often show up on the wall first.
              </p>
              <p>Good siding work accounts for these conditions instead of treating the wall as a decorative surface.</p>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section ui-page-section--soft">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>Useful references</h2>
              <ul>
                <li><a href="https://www.royalbuildingproducts.com/" target="_blank" rel="noreferrer">Royal Building Products</a></li>
                <li><a href="https://www.mittenbp.com/" target="_blank" rel="noreferrer">Mitten</a></li>
                <li><a href="https://gentek.ca/" target="_blank" rel="noreferrer">Gentek</a></li>
              </ul>
            </article>

            <article className="ui-card">
              <h2>Frequently asked questions</h2>
              <FaqAccordion items={vinylFaqItems} />
            </article>
          </div>
        </PageContainer>
      </section>


      


      <CtaBand
        title="Need to price vinyl siding work?"
        body="Start with the instant quote and we can narrow the scope around trim, detailing, and wall condition after that."
      />
      <ServiceGeoPosts geoPosts={geoPosts} />
    </>
  );
}
