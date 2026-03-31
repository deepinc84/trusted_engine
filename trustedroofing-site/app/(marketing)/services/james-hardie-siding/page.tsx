import Link from "next/link";
import CtaBand from "@/components/ui/CtaBand";
import FaqAccordion from "@/components/FaqAccordion";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import ServiceSchema from "@/components/ServiceSchema";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "James Hardie Siding Service",
  description: "James Hardie fiber cement siding installation in Calgary with attention to flashing, moisture control, layout, and climate-specific detailing.",
  path: "/services/james-hardie-siding"
});

const hardieFaqItems = [
  {
    question: "How much does James Hardie siding cost in Calgary?",
    answer:
      "James Hardie usually costs more than vinyl because the material is heavier, cutting and handling take longer, and the trim and fastening details need more labour. Height, access, wall prep, and trim package all move the final number."
  },
  {
    question: "What is the difference between fiber cement and vinyl siding?",
    answer:
      "Fiber cement gives you a heavier look and a more rigid finished wall. Vinyl is lighter, easier on budget, and often the practical answer when the homeowner wants a clean exterior upgrade without stepping into a more expensive system."
  },
  {
    question: "Is Hardie siding worth it in Alberta?",
    answer:
      "It can be, especially when the homeowner wants a more substantial look and is prepared for the higher install cost. It is not automatically the right answer for every house. The wall condition, budget, and finish goals still matter more than the brand name."
  },
  {
    question: "How does James Hardie siding handle hail resistance in Calgary?",
    answer:
      "Fiber cement is a tougher wall finish than many lightweight cladding products, but hail resistance still depends on the severity of the storm and the surrounding trim details. It should be chosen as part of a full wall system, not as a single-material shortcut."
  },
  {
    question: "Does Hardie siding need special installation details?",
    answer:
      "Yes. Cutting, fastening, clearances, flashing, and moisture control all need to be handled carefully. A premium board on a weak detail package still leads to problems."
  },
  {
    question: "When is vinyl siding the better choice?",
    answer:
      "Vinyl is usually the better fit when budget is the main limiter and the goal is to clean up the exterior, correct problem areas, and get a durable finish without turning the project into a heavier redesign."
  }
] as const;

function buildHardieFaqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: hardieFaqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}

export default function JamesHardieSidingPage() {
  const faqSchema = buildHardieFaqSchema();

  return (
    <>
      {/* Service schema is handled by ServiceSchema. FAQ schema is emitted once below. Do not duplicate the Service schema here. */}
      <ServiceSchema serviceName="James Hardie Siding Service" serviceSlug="james-hardie-siding" serviceType="Fiber cement siding" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <PageHero
        eyebrow="James Hardie siding service"
        title="Fiber cement siding when the wall needs a heavier finish"
        description="James Hardie siding is usually chosen by homeowners who want a more substantial look, stronger visual lines, and a cladding system that feels more rigid on the wall."
        actions={<Link href="/online-estimate" className="button">Start instant quote</Link>}
      />

      <section className="ui-page-section">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>What fiber cement siding is</h2>
              <p>
                Fiber cement siding is a manufactured cladding product designed to give the wall a heavier, more solid
                appearance than many lightweight systems. Homeowners usually end up here because they want stronger lines,
                more visual depth, and a finish that feels closer to a painted board system than a lightweight panel.
              </p>
              <p>
                James Hardie is the name most homeowners know, so that is usually where the conversation starts. The real
                decision, though, is whether the house, the budget, and the expected finish justify a more demanding system.
              </p>
            </article>

            <article className="ui-card">
              <h2>Why homeowners choose it</h2>
              <p>
                The draw is usually a combination of appearance, stability, and long-term finish expectations. Homeowners
                who do not like the lighter look of vinyl often prefer fiber cement because the wall reads cleaner and more
                architectural when the layout and trim package are done properly.
              </p>
              <p>
                It makes the most sense when the owner cares about the overall presentation of the house and is willing to
                spend more to get there.
              </p>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section ui-page-section--soft">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>Calgary-specific performance</h2>
              <p>
                Calgary walls deal with hail, sun, chinook swings, freeze-thaw movement, and strong wind exposure. Those
                conditions punish weak joints, sloppy flashing, and trim packages that do not shed water cleanly.
              </p>
              <p>
                Fiber cement can be a strong fit here, but only when the surrounding assembly is detailed properly. Material
                choice helps, but layout, clearances, and moisture control are what keep the wall performing over time.
              </p>
            </article>

            <article className="ui-card">
              <h2>Installation considerations</h2>
              <p>
                Hardie work is not just about hanging boards. Cutting, fastening, flashing, joint planning, and moisture
                management need to be handled with discipline. Openings, roof-to-wall transitions, and clearance details all
                matter because the wall is only as good as the weak point around it.
              </p>
              <p>
                That is why we look at the whole assembly before calling the scope ready. A premium material with weak prep
                work still creates a bad result.
              </p>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>Where it makes sense and where it does not</h2>
              <p>
                James Hardie usually makes sense when the homeowner wants a more substantial finish, is planning a broader
                exterior upgrade, and does not want the wall to read like a lighter system. It can also make sense when the
                trim package and architectural lines are central to the result.
              </p>
              <p>
                It is not automatically the best answer when the main goal is to solve a practical siding problem without
                pushing the budget too far. In those cases, <Link href="/services/siding">vinyl siding Calgary</Link> is
                often the more balanced direction.
              </p>
            </article>

            <article className="ui-card">
              <h2>Budget comparison</h2>
              <p>
                In a lot of cases, the decision comes down to budget more than anything else. Fiber cement systems carry a
                higher material and installation cost, and not every project needs that level of build. When the goal is to
                clean up the exterior, correct problem areas, and get a consistent finish without pushing the scope too far,
                vinyl siding is usually the more practical direction.
              </p>
              <p>
                Homeowners who want to review the manufacturer side of the system can also visit the official <a href="https://www.jameshardie.com/" target="_blank" rel="noreferrer">James Hardie website</a>.
              </p>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section ui-page-section--soft">
        <PageContainer>
          <article className="ui-card">
            <h2>Frequently asked questions</h2>
            <FaqAccordion items={hardieFaqItems} />
          </article>
        </PageContainer>
      </section>

      <CtaBand
        title="Trying to decide between vinyl and Hardie?"
        body="Start with the instant quote, then we can sort out whether the added cost of a fiber cement system actually fits the project."
      />
    </>
  );
}
