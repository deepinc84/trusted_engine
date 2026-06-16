import Image from "next/image";
import Link from "next/link";
import LocalBusinessSchema from "@/components/LocalBusinessSchema";
import ActivitySection from "@/components/home/ActivitySection";
import FeaturedProjects from "@/components/home/FeaturedProjects";
import ProofStrip from "@/components/home/ProofStrip";
import ServiceAreas from "@/components/home/ServiceAreas";
import ServicesGrid from "@/components/home/ServicesGrid";
import WhyTrusted from "@/components/home/WhyTrusted";
import type { HomeActivity, HomeMetric, HomeProject, HomeService } from "@/components/home/types";
import { countLiveQuoteSignals, listProjects, listServices } from "@/lib/db";
import { getPlaceholderProjectImage } from "@/lib/images";
import {
  getRecentQuoteSignals,
  getRecentRoofingExteriorActivity,
} from "@/lib/activity-feed";
import { getTopQuoteNeighborhoods } from "@/lib/seo-engine";
import { buildMetadata } from "@/lib/seo";
import { formatRelativeTime } from "@/lib/time";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Calgary Roofing Company | Roofers & Estimates",
  description:
    "Trusted Roofing & Exteriors is a Calgary roofing company helping homeowners with roof replacement, roof repair, siding, eavestrough, soffit, fascia, and instant online estimates.",
  path: "/"
});

function HomeHero({ metrics, quoteSignals }: { metrics: HomeMetric[]; quoteSignals: HomeActivity[] }) {
  return (
    <section className="homev3-hero" id="top">
      <Image
        src="https://images.unsplash.com/photo-1632759145351-1d592919f522?w=1800&q=85&auto=format&fit=crop"
        alt="Calgary roofline"
        fill
        className="homev3-hero__bg"
        priority
      />
      <div className="homev3-hero__overlay" />
      <div className="homev3-container homev3-hero__content home-seo-hero">
        <div>
          <p className="homev3-eyebrow">Calgary roofing company</p>
          <h1>Calgary Roofing Company for Roof Replacement, Repairs & Exterior Estimates</h1>
          <p className="homev3-hero__sub">
            Compare roofing, siding, and eavestrough options with a Calgary roofing contractor that
            gives homeowners fast online estimates, recent project proof, and clear follow-up when
            they are ready.
          </p>
          <div className="homev3-hero__actions">
            <Link href="/online-estimate" className="button">Get instant roof quote</Link>
            <Link href="/projects" className="button button--ghost">View recent projects</Link>
          </div>
          <div className="homev3-hero__proof">
            {metrics.slice(0, 4).map((metric) => (
              <div key={metric.id}>
                <strong>{metric.value_text}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
        </div>
        <aside className="homev3-activity-card">
          <div className="homev3-activity-card__head">
            <h3>Recent quote signals</h3>
            <span>Live</span>
          </div>
          <ul>
            {quoteSignals.map((item) => (
              <li key={item.id}>
                <div>
                  <strong><Link href={item.href}>{item.message}</Link></strong>
                  <p>{item.location}</p>
                </div>
                <em>{formatRelativeTime(item.occurredAt)}</em>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}

function RoofingContractorsSection() {
  return (
    <section className="homev3-section">
      <div className="homev3-container">
        <p className="homev3-eyebrow homev3-eyebrow--dark">Calgary roofing contractors</p>
        <h2 className="homev3-title">A Calgary roofing company built for homeowners comparing contractors</h2>
        <p className="homev3-copy">
          If you are comparing roofing companies in Calgary, the hard part is knowing who gives
          clear pricing, who documents the work properly, and who can handle more than one exterior
          scope. Trusted Roofing & Exteriors helps Calgary homeowners price roof replacement, roof
          repair, siding, eavestrough, soffit, fascia, and full exterior work from one place.
        </p>
        <div className="homev3-services-grid home-seo-support-grid">
          <article className="homev3-service-card">
            <h3>Roofing contractors for replacement and repairs</h3>
            <p>
              Plan roof replacement, roof repair, storm damage work, and aging shingle projects with
              a Calgary roofing contractor that gives you a fast estimate before asking for a full
              follow-up quote.
            </p>
          </article>
          <article className="homev3-service-card">
            <h3>Roofers for Calgary hail, wind, and aging shingles</h3>
            <p>
              Calgary roofs deal with hail, wind, freeze-thaw cycles, sun exposure, and sudden
              weather shifts. Our roofing pages and project examples help homeowners compare options
              before booking work.
            </p>
          </article>
          <article className="homev3-service-card">
            <h3>Exterior crews for siding, eavestrough, soffit, and fascia</h3>
            <p>
              Many exterior projects involve more than one trade. Trusted Roofing & Exteriors helps
              homeowners compare roofing, siding, eavestrough, soffit, and fascia scopes from the
              same online estimate path.
            </p>
          </article>
        </div>
        <div className="homev3-hero__actions">
          <Link href="/online-estimate" className="button">Start with an instant estimate</Link>
        </div>
      </div>
    </section>
  );
}

function HomeCtaBand() {
  return (
    <section className="homev3-cta" id="cta">
      <div className="homev3-container">
        <p className="homev3-eyebrow">Ready to start?</p>
        <h2 className="homev3-title">Get an instant estimate for your roof or exterior project</h2>
        <p className="homev3-copy homev3-copy--muted">
          See pricing ranges quickly, informed by real Calgary activity.
        </p>
        <div className="homev3-hero__actions">
          <Link href="/online-estimate" className="button">Get instant roof quote</Link>{" "}
          <a href="tel:5872883351" className="button button--ghost">Call 587-288-3351</a>
        </div>
      </div>
    </section>
  );
}

function toTitle(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function HomePage() {
  const [projects, services, quoteCount, topAreas, quoteSignals, activity] = await Promise.all([
    listProjects({ limit: 6, include_unpublished: false }),
    listServices(),
    countLiveQuoteSignals(),
    getTopQuoteNeighborhoods(20),
    getRecentQuoteSignals(5),
    getRecentRoofingExteriorActivity(12)
  ]);

  const metrics: HomeMetric[] = [
    {
      id: "live-quotes",
      key_name: "live_quote_signals",
      label: "Instant Quotes Generated",
      value_text: quoteCount.toLocaleString(),
      sort_order: 1,
      is_active: true
    },
    {
      id: "turnaround",
      key_name: "instant_quote_turnaround",
      label: "Instant Quote Turnaround",
      value_text: "< 60s",
      sort_order: 2,
      is_active: true
    },
    {
      id: "warranty",
      key_name: "workmanship_warranty",
      label: "Workmanship warranty",
      value_text: "10yr",
      sort_order: 3,
      is_active: true
    },
    {
      id: "accuracy",
      key_name: "instant_quote_accuracy",
      label: "Final Quote Accuracy",
      value_text: "99%",
      sort_order: 4,
      is_active: true
    }
  ];

  const homeServices: HomeService[] = services.slice(0, 4).map((service) => ({
    slug: service.slug,
    title: service.title,
    copy: service.base_sales_copy ?? "Exterior service tailored for Calgary homes."
  }));

  const featuredProjects: HomeProject[] = projects.slice(0, 3).map((project) => ({
    id: project.id,
    slug: project.slug,
    title: project.title,
    service: toTitle(project.service_slug),
    neighborhood: `${project.neighborhood ?? project.city}, ${project.province}`,
    summary: project.summary,
    image: project.photos?.[0]?.public_url ?? getPlaceholderProjectImage({
      seed: project.slug,
      neighborhood: project.neighborhood,
      quadrant: project.quadrant,
      city: project.city
    })
  }));

  const calgaryAreas = topAreas.filter((area) => area.city === "Calgary");

  return (
    <>
      <LocalBusinessSchema />
      <style>{`
        .home-seo-hero {
          grid-template-columns: minmax(0, 1.35fr) minmax(280px, 360px);
        }

        .home-seo-hero h1 {
          font-size: clamp(2.35rem, 4.5vw, 3.6rem);
        }

        .home-seo-hero .homev3-activity-card {
          align-self: start;
        }

        .home-seo-support-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        @media (max-width: 980px) {
          .home-seo-hero {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 680px) {
          .home-seo-support-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <HomeHero metrics={metrics} quoteSignals={quoteSignals} />
      <ProofStrip metrics={metrics} />
      <RoofingContractorsSection />
      <ServicesGrid services={homeServices} />
      <ActivitySection activity={activity} />
      <FeaturedProjects projects={featuredProjects} />
      <WhyTrusted />
      <HomeCtaBand />
      <ServiceAreas areas={calgaryAreas.map((area) => ({
        id: area.slug,
        name: area.neighborhood,
        slug: area.slug,
        active: true
      }))} />
    </>
  );
}
