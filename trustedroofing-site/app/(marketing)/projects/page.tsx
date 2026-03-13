import CtaBand from "@/components/ui/CtaBand";
import NeighborhoodChips from "@/components/ui/NeighborhoodChips";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import ProjectCard from "@/components/ProjectCard";
import { listProjects, listServices } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Projects",
  description: "Published Calgary project nodes for roofing and exterior services.",
  path: "/projects"
});

export default async function ProjectsPage({
  searchParams
}: {
  searchParams?: { service_slug?: string; neighborhood?: string };
}) {
  const [services, projects] = await Promise.all([
    listServices(),
    listProjects({
      service_slug: searchParams?.service_slug ?? null,
      neighborhood: searchParams?.neighborhood ?? null,
      include_unpublished: false,
      limit: 200
    })
  ]);

  const serviceChips = [
    { label: "All services", href: "/projects" },
    ...services.map((service) => ({
      label: service.title,
      href: `/projects?service_slug=${encodeURIComponent(service.slug)}`
    }))
  ];

  const neighborhoods = Array.from(
    new Set(projects.map((project) => project.neighborhood).filter(Boolean))
  ) as string[];

  const neighborhoodChips = neighborhoods.map((name) => ({
    label: name,
    href: `/projects?neighborhood=${encodeURIComponent(name)}`
  }));

  return (
    <>
      <PageHero
        eyebrow="Portfolio"
        title="Project directory"
        description="Published, real project nodes with service and neighborhood context."
      />

      <section className="ui-page-section">
        <PageContainer>
          <NeighborhoodChips chips={serviceChips} />
          <NeighborhoodChips chips={neighborhoodChips} />

          <div className="ui-grid ui-grid--projects" style={{ marginTop: 20 }}>
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </PageContainer>
      </section>

      <CtaBand
        title="Want a similar scope for your home?"
        body="Use instant quote to compare your property against local project ranges."
      />
    </>
  );
}
