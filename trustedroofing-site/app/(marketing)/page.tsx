import LocalBusinessSchema from "@/components/LocalBusinessSchema";
import ActivitySection from "@/components/home/ActivitySection";
import CTABand from "@/components/home/CTABand";
import FeaturedProjects from "@/components/home/FeaturedProjects";
import HeroSection from "@/components/home/HeroSection";
import ProofStrip from "@/components/home/ProofStrip";
import ServiceAreas from "@/components/home/ServiceAreas";
import ServicesGrid from "@/components/home/ServicesGrid";
import WhyTrusted from "@/components/home/WhyTrusted";
import type { HomeProject, HomeService } from "@/components/home/types";
import { listHomepageMetrics, listProjects, listServices } from "@/lib/db";
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
  const [projects, services, metrics, areas, activity] = await Promise.all([
    listProjects({ limit: 6, include_unpublished: false }),
    listServices(),
    listHomepageMetrics(),
    getTopQuoteNeighborhoods(8),
    getLiveActivityFeed(12)
  ]);

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
      <ServiceAreas areas={areas.map((area) => ({
        id: area.slug,
        name: area.neighborhood,
        slug: area.slug,
        active: true
      }))} />
    </>
  );
}
