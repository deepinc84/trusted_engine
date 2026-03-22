import LocalBusinessSchema from "@/components/LocalBusinessSchema";
import ActivitySection from "@/components/home/ActivitySection";
import CTABand from "@/components/home/CTABand";
import FeaturedProjects from "@/components/home/FeaturedProjects";
import HeroSection from "@/components/home/HeroSection";
import ProofStrip from "@/components/home/ProofStrip";
import ServiceAreas from "@/components/home/ServiceAreas";
import ServicesGrid from "@/components/home/ServicesGrid";
import WhyTrusted from "@/components/home/WhyTrusted";
import type { HomeMetric, HomeProject, HomeService } from "@/components/home/types";
import { countLiveQuoteSignals, listProjects, listServices } from "@/lib/db";
import { getPlaceholderProjectImage } from "@/lib/images";
import { getLiveActivityFeed } from "@/lib/activity-feed";
import { getTopQuoteNeighborhoods } from "@/lib/seo-engine";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Roofing & exterior services in Calgary",
  description:
    "Modern, fast roofing and exterior services with local project insights for Calgary homeowners.",
  path: "/"
});

function toTitle(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function HomePage() {
  const [projects, services, quoteCount, topAreas, activity] = await Promise.all([
    listProjects({ limit: 6, include_unpublished: false }),
    listServices(),
    countLiveQuoteSignals(),
    getTopQuoteNeighborhoods(20),
    getLiveActivityFeed(12)
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

  const calgaryAreas = topAreas.filter((area) => area.city === "Calgary").slice(0, 8);

  return (
    <>
      <LocalBusinessSchema />
      <HeroSection metrics={metrics} activity={activity} />
      <ProofStrip metrics={metrics} />
      <ServicesGrid services={homeServices} />
      <ActivitySection activity={activity} />
      <FeaturedProjects projects={featuredProjects} />
      <WhyTrusted />
      <CTABand />
      <ServiceAreas areas={calgaryAreas.map((area) => ({
        id: area.slug,
        name: area.neighborhood,
        slug: area.slug,
        active: true
      }))} />
    </>
  );
}
