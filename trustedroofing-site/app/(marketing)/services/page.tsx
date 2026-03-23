import Link from "next/link";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import ServiceCard from "@/components/ui/ServiceCard";
import { listServices } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";

const serviceHighlights = [
  {
    title: "Roofing systems built for Calgary weather",
    body: "We replace and upgrade asphalt shingle roofs with attention to ventilation, ice-dam risk, flashing details, and manufacturer-approved installation methods."
  },
  {
    title: "Siding that manages wind, moisture, and curb appeal",
    body: "Our siding work focuses on water management, trim details, and clean transitions around windows, doors, soffit, and fascia so the finished exterior performs as well as it looks."
  },
  {
    title: "Eavestrough and drainage planning that protects the envelope",
    body: "We install 5-inch and 6-inch gutter systems, slope runs correctly, and look at downspout placement so roof runoff leaves the house instead of soaking the foundation or icing the walks."
  }
];

const processSteps = [
  "Start with the service that matches your main concern, whether that is roofing, siding, or drainage.",
  "Review scope, material options, and the local conditions that matter in Calgary before booking a site visit.",
  "Use the instant quote tool for a realistic budget range based on real completed projects, roof size, pitch, and neighborhood-level pricing data.",
  "Move into site review, final measurements, and written scope confirmation before production starts."
];

const faqs = [
  {
    question: "What services does Trusted Roofing & Exteriors actually provide?",
    answer: "The core service lines are roofing, siding, eavestrough and gutter replacement, roof repair, and related exterior work such as soffit and fascia. Each page explains what is included, where the scope starts, and when a repair makes more sense than a full replacement."
  },
  {
    question: "Do you work only in Calgary?",
    answer: "Calgary is the main service area, with surrounding work in Airdrie, Chestermere, and Cochrane when scheduling and scope align. Local weather patterns still drive the way we plan materials and installation details."
  },
  {
    question: "How do I know which service page fits my project?",
    answer: "If the main issue is the roof covering, flashing, or ventilation, start with roofing. If the exterior cladding is faded, loose, or taking on moisture, start with siding. If runoff control or overflow is the concern, start with the eavestrough page."
  },
  {
    question: "Can I get pricing before booking an inspection?",
    answer: "Yes. The instant quote page is designed to provide a realistic range first. It is not a generic estimator. It uses local project and quote data to set an informed starting point before an on-site review."
  },
  {
    question: "Why do material choices matter so much in Alberta?",
    answer: "Calgary roofs and exteriors take hail, wind-driven rain, sharp temperature swings, UV exposure, and freeze-thaw cycles. Material durability, fastening patterns, ventilation, and drainage details all affect how long the assembly lasts."
  },
  {
    question: "Do you help compare standard and premium options?",
    answer: "Yes. That is part of the planning process. We explain where a standard product is enough, where premium impact resistance or heavier profiles add value, and how those differences affect budget and long-term performance."
  }
];

export const metadata = buildMetadata({
  title: "Services",
  description: "Calgary roofing, siding, and eavestrough services explained in practical terms, with clear scope, material options, and next steps.",
  path: "/services"
});

export default async function ServicesPage() {
  const services = await listServices();

  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Roofing and exterior services for Calgary homes"
        description="This is the starting point if you need a roof replacement, siding upgrade, or a better drainage plan. Each service page explains what we do, why it matters in Alberta, and how the work is handled in real conditions."
        actions={
          <>
            <Link href="/quote" className="button">Get an instant quote</Link>
            <Link href="/projects" className="button button--ghost">Browse projects</Link>
          </>
        }
      />

      <section className="ui-page-section">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>What this hub is for</h2>
              <p>
                Homeowners usually know the symptom before they know the proper scope. Maybe the shingles are shedding granules.
                Maybe the siding is wavy after a storm. Maybe the eavestroughs overflow every spring. This page is meant to help
                you sort that out quickly, without burying you in generic sales copy.
              </p>
              <p>
                Every core page explains what the service includes, when it makes sense, what material options are worth comparing,
                and what Calgary weather does to that part of the home. Use it to narrow the problem, build a budget range, and
                decide what should happen first.
              </p>
            </article>

            <article className="ui-card">
              <h2>How the process works</h2>
              <ol>
                {processSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section ui-page-section--soft">
        <PageContainer>
          <h2 className="homev3-title">Core services at a glance</h2>
          <div className="ui-grid ui-grid--services" style={{ marginTop: 20 }}>
            {services.map((service) => (
              <ServiceCard
                key={service.slug}
                slug={service.slug}
                title={service.title}
                description={service.base_sales_copy ?? "Real Calgary exterior service guidance and project-backed planning."}
              />
            ))}
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section">
        <PageContainer>
          <div className="ui-grid ui-grid--services">
            {serviceHighlights.map((item) => (
              <article className="ui-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section ui-page-section--soft">
        <PageContainer>
          <article className="ui-card">
            <h2>Calgary factors that change the scope</h2>
            <p>
              A house in Calgary takes a different kind of abuse than a house in a mild coastal market. Hail can shorten the life
              of shingles and dent metal accessories. Freeze-thaw cycles expose weak flashing and low-slope drainage problems.
              Chinook swings can move moisture where it should not go, especially when attic ventilation is unbalanced. Wind-driven
              rain tests siding laps, trim, and window detailing. That is why the right service decision is not just about what looks worn.
              It is about how the full assembly is handling water, air, and temperature shifts.
            </p>
          </article>
        </PageContainer>
      </section>

      <section className="ui-page-section">
        <PageContainer>
          <article className="ui-card">
            <h2>Material references</h2>
            <p>
              If you want to review the manufacturer systems we commonly discuss, start with
              {" "}<a href="https://www.gaf.ca/residential-roofing/shingles/timberline-hd" target="_blank" rel="noreferrer">GAF Timberline HD shingles</a>,
              {" "}<a href="https://www.royalbuildingproducts.com/products/siding" target="_blank" rel="noreferrer">Royal Building Products siding</a>, and
              {" "}<a href="https://www.euroshieldroofing.com/" target="_blank" rel="noreferrer">Euroshield rubber roofing systems</a>.
              Those references help when you are comparing appearance, impact resistance, and warranty language.
            </p>
          </article>
        </PageContainer>
      </section>

      <section className="ui-page-section ui-page-section--soft">
        <PageContainer>
          <article className="ui-card">
            <h2>Frequently asked questions</h2>
            {/* Schema note: apply FAQ schema to this section only. Keep one clear primary page type and avoid duplicate FAQ markup elsewhere. */}
            <div className="ui-list-links" style={{ display: "grid", gap: 20 }}>
              {faqs.map((item) => (
                <div key={item.question}>
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </div>
              ))}
            </div>
          </article>
        </PageContainer>
      </section>

      <CtaBand
        title="Need pricing before you book a visit?"
        body="Start with the instant quote. It gives a realistic range first, then we narrow scope and materials with you."
      />
    </>
  );
}
