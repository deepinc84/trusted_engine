import Link from "next/link";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import ServiceCard from "@/components/ui/ServiceCard";
import GeoPostCard from "@/components/GeoPostCard";
import { listGeoPosts, listServices } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import dynamicImport from "next/dynamic";

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
  title: "Services",
  description: "Calgary roofing, siding, and eavestrough services explained in practical terms, with clear scope, material options, and next steps.",
  path: "/services"
});

export default async function ServicesPage() {
  const [services, recentGeoPosts] = await Promise.all([
    listServices(),
    listGeoPosts(5)
  ]);
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

  const serviceCards = services.flatMap((service) => {
    if (service.slug !== "siding") return [service];

    return [
      {
        ...service,
        title: "Vinyl Siding Service",
        base_sales_copy: "Vinyl siding replacement focused on trim, flashing, and clean finish details."
      },
      {
        ...service,
        id: `${service.id}-hardie`,
        slug: "james-hardie-siding",
        title: "James Hardie siding Calgary",
        base_sales_copy: "Fiber cement siding for homeowners who want a heavier finish and a more architectural exterior."
      }
    ];
  });

  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Roofing and Exterior Services in Calgary, Alberta"
        description="This is where to start if you need roofing, siding, or eavestrough work on your home in Calgary.  Each service below breaks down what the work actually involves, when it’s needed, and how it’s handled on real homes. Whether you’re dealing with a leak, planning a full roof replacement, or trying to fix drainage or exterior issues, this page is meant to give you a clear direction before you move forward."
        actions={
          <>
            <Link href="/online-estimate" className="button">Get an instant quote</Link>
            <Link href="/projects" className="button button--ghost">Browse projects</Link>
          </>
        }
      />

      <section className="ui-page-section">
        <PageContainer>
          <div className="ui-grid ui-grid--services">
            {serviceCards.map((service) => (
              <ServiceCard
                key={service.slug}
                slug={service.slug}
                title={service.title}
                description={service.base_sales_copy ?? "Real Calgary exterior service guidance and project-backed planning."}
              />
            ))}
          </div>

          {recentGeoPosts.length > 0 ? (
            <article className="ui-card" style={{ marginTop: 24 }}>
              <h2>Recent Published Geo Posts Across Services</h2>
              <div className="carousel" aria-label="Recent geo posts across all services">
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
            <p className="homev3-copy"><Link href="/services/roofing">Roofing</Link> covers full replacements and complete roof system installs. That includes everything from tear-off to new materials, ventilation adjustments, and tying the system together properly.</p>
            <p className="homev3-copy"><Link href="/services/roof-repair">Roof repair</Link> is more targeted. It focuses on leaks, storm damage, and localized failures where the rest of the roof may still have life left.</p>
            <p className="homev3-copy"><Link href="/services/gutters">Eavestrough and drainage work</Link> controls how water moves off the roof and away from the house. When that fails, it can cause ongoing problems even if the roof itself is still in decent condition.</p>
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
        title="Need pricing before you book a visit?"
        body="Start with the instant quote to get a realistic range for your home, then we can narrow the scope and materials based on your house."
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
