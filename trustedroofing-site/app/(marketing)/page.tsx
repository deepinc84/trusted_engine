import LocalBusinessSchema from "@/components/LocalBusinessSchema";
import ActivitySection from "@/components/home/ActivitySection";
import CTABand from "@/components/home/CTABand";
import FeaturedProjects from "@/components/home/FeaturedProjects";
import HeroSection from "@/components/home/HeroSection";
import ProofStrip from "@/components/home/ProofStrip";
import ServiceAreas from "@/components/home/ServiceAreas";
import ServicesGrid from "@/components/home/ServicesGrid";
import WhyTrusted from "@/components/home/WhyTrusted";
import type { HomeActivity, HomeProject, HomeService } from "@/components/home/types";
import {
  listHomepageMetrics,
  listProjects,
  listRecentInstaquoteAddressQueries,
  listServiceAreas,
  listServices
} from "@/lib/db";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Roofing & exterior services in Calgary",
  description:
    "Modern, fast roofing and exterior services with local project insights for Calgary homeowners.",
  path: "/"
});

const projectFallbackImage = [
  "/projects/project-1.svg",
  "/projects/project-2.svg",
  "/projects/project-3.svg"
];

function scopeLabel(serviceType: string | null, scopes: string[] | null) {
  if (serviceType?.includes("SidingHardie") || scopes?.includes("siding_hardie")) return "Instant hardie siding estimate";
  if (serviceType?.includes("SidingVinyl") || scopes?.includes("siding_vinyl")) return "Instant vinyl siding estimate";
  if (serviceType?.includes("Eavestrough") || scopes?.includes("eavestrough")) return "Instant eavestrough estimate";
  if (serviceType?.includes("All") || (scopes?.length ?? 0) > 1) return "Instant full exterior estimate";
  return "Instant roof estimate";
}

function toTitle(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function publicLocationFromAddress(address: string) {
  const upper = address.toUpperCase();
  const quadrant = upper.match(/\b(NE|NW|SE|SW)\b/)?.[1] ?? null;
  if (quadrant) return `${quadrant} Calgary`;
  if (address.toLowerCase().includes("calgary")) return "Calgary";
  return "Calgary area";
}

export default async function HomePage() {
  const [projects, services, metrics, areas, quoteActivity] = await Promise.all([
    listProjects({ limit: 6, include_unpublished: false }),
    listServices(),
    listHomepageMetrics(),
    listServiceAreas(),
    listRecentInstaquoteAddressQueries(8)
  ]);

  const homeServices: HomeService[] = services.slice(0, 4).map((service) => ({
    slug: service.slug,
    title: service.title,
    copy: service.base_sales_copy ?? "Exterior service tailored for Calgary homes."
  }));

  const recentQuoteActivity: HomeActivity[] = quoteActivity.map((row) => ({
    id: `quote-${row.id}`,
    service: scopeLabel(row.service_type, row.requested_scopes),
    location: publicLocationFromAddress(row.address),
    occurredAt: row.queried_at
  }));

  const activity = recentQuoteActivity.slice(0, 8);

  const featuredProjects: HomeProject[] = projects.slice(0, 3).map((project, index) => ({
    id: project.id,
    slug: project.slug,
    title: project.title,
    service: toTitle(project.service_slug),
    neighborhood: `${project.neighborhood ?? project.city}, ${project.province}`,
    summary: project.summary,
    image: project.photos?.[0]?.public_url ?? projectFallbackImage[index % projectFallbackImage.length]
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
      <ServiceAreas areas={areas.filter((area) => area.active)} />
    </>
  );
}
