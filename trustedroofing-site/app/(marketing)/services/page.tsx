import Link from "next/link";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import ServiceCard from "@/components/ui/ServiceCard";
import GeoPostCard from "@/components/GeoPostCard";
import { listGeoPosts } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import dynamicImport from "next/dynamic";

import BreadcrumbSchema from "@/components/BreadcrumbSchema";
const FaqAccordion = dynamicImport(() => import("@/components/FaqAccordion"), {
  ssr: false,
  loading: () => <p className="homev3-copy">Loading FAQ…</p>
});

const faqs = [
  {
    question: "What’s the difference between roof repair and roof replacement?",
    answer: "Roof repair focuses on fixing a specific issue like a leak, damaged shingles, or a problem area. Roof replacement involves removing the existing system and installing a new one across the entire roof. The right option depends on the condition of the roof and how widespread the problem is."
  },
  {
    question: "How do I know if I need new eavestrough or just a repair?",
    answer: "If the system is leaking at joints, pulling away from the house, or overflowing due to poor sizing or slope, replacement is usually the better long-term fix. Smaller issues like a loose section or minor blockage can often be repaired."
  },
  {
    question: "Can siding issues cause problems inside the house?",
    answer: "Yes. Siding isn’t just for appearance. If it’s damaged or installed improperly, moisture can get behind the system and lead to long-term issues. That’s why siding, soffit, and fascia are tied closely to how the home manages airflow and moisture."
  },
  {
    question: "Is it better to fix one issue or do everything at once?",
    answer: "It depends on the condition of the home. Sometimes a targeted repair is the right move. Other times, multiple issues are connected, and handling them together prevents repeat problems. The goal is to avoid doing the same work twice."
  },
  {
    question: "What usually causes roofing problems in Calgary?",
    answer: "Wind, hail, temperature swings, and installation quality are the biggest factors. Some roofs fail because they’ve reached the end of their life, while others fail early due to how they were originally installed."
  },
  {
    question: "Do I need an inspection before getting pricing?",
    answer: "Not always. If you want a rough range first, the instant quote tool is the fastest way to get a baseline. From there, the exact scope can be confirmed once the home is looked at directly."
  },
  {
    question: "How long does most exterior work take?",
    answer: "Most roofing projects are completed in a day or two depending on size and complexity. Repairs can be shorter. Siding and full exterior work take longer because there are more components involved."
  },
  {
    question: "What should I do if I’m not sure what service I need?",
    answer: "Start with the problem you’re seeing. If that’s not clear, use the instant quote tool to get a starting point, then narrow it down from there. Most homeowners don’t know exactly what they need at the beginning, and that’s normal."
  }
] as const;

export const metadata = buildMetadata({
  title: "Calgary Roofing & Exterior Services | Trusted",
  description: "Explore Calgary roofing, roof repair, roof replacement, siding, eavestrough, soffit, and fascia services, then start an instant online estimate.",
  path: "/services"
});

export default async function ServicesPage() {
  const recentGeoPosts = await listGeoPosts(5);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };

  const serviceHierarchy = [
    {
      heading: "Roofing Services",
      intro: "Start here for full roof systems, targeted repairs, and roof condition planning on Calgary homes.",
      services: [
        {
          slug: "roofing",
          title: "Roofing Services",
          description: "Compare roof replacement, roof repair, inspection, and maintenance options before deciding what your home needs."
        },
        {
          slug: "roof-replacement",
          title: "Roof Replacement",
          description: "Plan a complete reroof with practical guidance on tear-off, shingles, ventilation, and roof system details."
        },
        {
          slug: "roof-repair",
          title: "Roof Repair",
          description: "Fix leaks, missing shingles, storm damage, and localized roof failures when the whole roof may not need replacing."
        },
        {
          slug: "roof-inspection-maintenance",
          title: "Roof Inspection & Maintenance",
          description: "Check roof condition, maintenance priorities, and problem areas before small issues turn into larger repairs."
        }
      ]
    },
    {
      heading: "Siding Services",
      intro: "Compare siding materials and exterior wall upgrades based on budget, durability, and the look you want long term.",
      services: [
        {
          slug: "siding",
          title: "Siding Services",
          description: "Review Calgary siding replacement options and how siding ties into moisture control, trim, and exterior protection."
        },
        {
          slug: "vinyl-siding",
          title: "Vinyl Siding",
          description: "Choose a cost-controlled siding update with clean trim, flashing, and finish details for Calgary homes."
        },
        {
          slug: "james-hardie-siding",
          title: "James Hardie Siding",
          description: "Explore fiber cement siding for homeowners who want a heavier, more architectural exterior finish."
        }
      ]
    },
    {
      heading: "Eavestrough, Soffit & Fascia",
      intro: "Protect the roof edge, ventilation path, and drainage system with connected exterior metal and finishing services.",
      services: [
        {
          slug: "eavestrough-soffit-fascia",
          title: "Eavestrough, Soffit & Fascia",
          description: "See how drainage, roof-edge ventilation, fascia, and soffit work together as one exterior system."
        },
        {
          slug: "eavestrough",
          title: "Eavestrough",
          description: "Replace or upgrade gutters, downspouts, slope, and drainage paths so water moves away from the house."
        },
        {
          slug: "soffit-fascia",
          title: "Soffit & Fascia",
          description: "Repair or replace soffit and fascia details that support ventilation, protect roof edges, and finish the exterior."
        }
      ]
    }
  ] as const;

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "" },
          { name: "Services", path: "/services" }
        ]}
      />
      <PageHero
        eyebrow="Services"
        title="Calgary Roofing and Exterior Services"
        description="Trusted Roofing & Exteriors helps Calgary homeowners compare roofing, siding, eavestrough, soffit, fascia, repair, replacement, and maintenance scopes before starting an instant online estimate."
        actions={
          <>
            <Link href="/online-estimate" className="button">Get instant exterior estimate</Link>
            <Link href="/projects" className="button button--ghost">Browse projects</Link>
          </>
        }
      />

      <section className="ui-page-section">
        <PageContainer>
          <article className="ui-card" style={{ marginBottom: 24 }}>
            <h2>Start with an instant exterior estimate</h2>
            <p className="homev3-copy">If you already know the area of the home you want priced, use the instant estimate first. You can compare roof replacement, repair, siding, eavestrough, soffit, and fascia scopes before booking the next step.</p>
            <Link href="/online-estimate" className="button">Get instant exterior estimate</Link>
          </article>

          <div style={{ display: "grid", gap: 24 }}>
            {serviceHierarchy.map((section) => (
              <article className="ui-card" key={section.heading}>
                <h2>{section.heading}</h2>
                <p className="homev3-copy">{section.intro}</p>
                <div className="ui-grid ui-grid--services" style={{ marginTop: 20 }}>
                  {section.services.map((service) => (
                    <ServiceCard
                      key={service.slug}
                      slug={service.slug}
                      title={service.title}
                      description={service.description}
                    />
                  ))}
                </div>
              </article>
            ))}
          </div>

          {recentGeoPosts.length > 0 ? (
            <article className="ui-card" style={{ marginTop: 24 }}>
              <h2>Recent Published Project Updates Across Services</h2>
              <div className="carousel" aria-label="Recent published project updates across all services">
                {recentGeoPosts.map((post, index) => (
                  <GeoPostCard key={post.id} geoPost={post} eagerImage={index < 2} />
                ))}
              </div>
            </article>
          ) : null}

          <article className="ui-card" style={{ marginTop: 24 }}>
            <h2>What Work Usually Looks Like on Calgary Homes</h2>
            <p className="homev3-copy">Most exterior projects don’t start clean.</p>
            <p className="homev3-copy">A homeowner might think it’s just a small repair, but once the roof is opened up or the siding is removed, it turns into a larger scope. That can be ventilation issues, improper installs, drainage problems, or materials that failed early.</p>
            <p className="homev3-copy">Other times, it’s straightforward. A roof has reached the end of its life and needs to be replaced. Eavestrough is undersized or failing and needs to be redone. Siding has taken damage or just needs to be updated.</p>
            <p className="homev3-copy">The goal isn’t to push everything into a full replacement. It’s to figure out what the house actually needs and handle it properly the first time.</p>
          </article>

          <article className="ui-card" style={{ marginTop: 24 }}>
            <h2>Roofing, Siding, and Eavestrough Services Explained</h2>
            <p className="homev3-copy">Each service on this page is separated for a reason.</p>
            <p className="homev3-copy"><Link href="/services/roofing">Roofing services</Link> helps you choose between <Link href="/services/roof-replacement">roof replacement</Link>, repair, and inspection work. Roof replacement covers full reroofing and complete roof system installs. That includes everything from tear-off to new materials, ventilation adjustments, and tying the system together properly.</p>
            <p className="homev3-copy"><Link href="/services/roof-repair">Roof repair</Link> is more targeted. It focuses on leaks, storm damage, and localized failures where the rest of the roof may still have life left.</p>
            <p className="homev3-copy"><Link href="/services/eavestrough">Eavestrough and drainage work</Link> controls how water moves off the roof and away from the house. When that fails, it can cause ongoing problems even if the roof itself is still in decent condition.</p>
            <p className="homev3-copy"><Link href="/services/siding">Siding</Link>, <Link href="/services/soffit-fascia">soffit, and fascia</Link> are tied into both protection and appearance. They affect how the home handles moisture, airflow, and long-term durability.</p>
            <p className="homev3-copy">If you’re not sure which direction applies, that’s normal. Most homeowners aren’t. The service pages break it down further, but this page gives you the starting point.</p>
          </article>

          <article className="ui-card" style={{ marginTop: 24 }}>
            <h2>Comparing Siding Options on Real Homes</h2>
            <p className="homev3-copy">Siding decisions usually come down to budget, durability, and the look you want long term.</p>
            <p className="homev3-copy">Vinyl siding is the more cost-controlled option. It works well for many homes and keeps projects within a tighter range, especially when the wall system underneath is still in good shape.</p>
            <p className="homev3-copy"><Link href="/services/james-hardie-siding">James Hardie siding</Link> is heavier and more rigid. It’s typically chosen when homeowners want a more solid finish and longer-term durability, especially in areas that see more exposure.</p>
            <p className="homev3-copy">Both systems can work. The right choice depends on the house, the condition underneath, and what you’re trying to achieve with the exterior.</p>
            <p className="homev3-copy">On some homes, both options are used together depending on the elevation and budget.</p>
          </article>

          <article className="ui-card" style={{ marginTop: 24 }}>
            <h2>How to Choose the Right Service</h2>
            <p className="homev3-copy">If you’re not sure where to start, focus on the problem first.</p>
            <p className="homev3-copy">Leaks, missing shingles, or visible damage usually point toward repair or replacement. Overflowing gutters or pooling water point toward drainage issues. Warped or aging siding points toward exterior cladding work.</p>
            <p className="homev3-copy">If the issue isn’t obvious, that’s usually where most people get stuck.</p>
            <p className="homev3-copy">The easiest starting point is to get a rough range first. The <Link href="/online-estimate">instant quote tool</Link> gives you a baseline, and from there the scope can be narrowed down based on what your house actually needs.</p>
          </article>

          <article className="ui-card" style={{ marginTop: 24 }}>
            <h2>Service questions</h2>
            <FaqAccordion items={faqs} />
          </article>
        </PageContainer>
      </section>

      <CtaBand
        title="Ready to compare exterior pricing?"
        body="Get instant exterior estimate pricing first, then we can narrow the scope and materials based on your house."
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
