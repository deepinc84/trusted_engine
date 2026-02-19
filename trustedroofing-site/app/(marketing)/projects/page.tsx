import Link from "next/link";
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

  const neighborhoods = Array.from(
    new Set(projects.map((project) => project.neighborhood).filter(Boolean))
  );

  return (
    <section className="section">
      <div className="hero" style={{ gridTemplateColumns: "1fr" }}>
        <div>
          <h1 className="hero-title">Project directory</h1>
          <p className="hero-subtitle">
            Only published, real project nodes are listed here.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
        <Link className="badge" href="/projects">All services</Link>
        {services.map((service) => (
          <Link
            className="badge"
            key={service.slug}
            href={`/projects?service_slug=${encodeURIComponent(service.slug)}`}
          >
            {service.title}
          </Link>
        ))}
      </div>

      {neighborhoods.length ? (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
          {neighborhoods.map((neighborhood) => (
            <Link
              className="badge"
              key={neighborhood as string}
              href={`/projects?neighborhood=${encodeURIComponent(neighborhood as string)}`}
            >
              {neighborhood as string}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="card-grid" style={{ marginTop: 28 }}>
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}
