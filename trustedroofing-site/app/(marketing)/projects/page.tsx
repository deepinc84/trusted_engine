import ProjectCard from "@/components/ProjectCard";
import { listProjects } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Projects",
  description: "Recent roofing and exterior projects completed in Calgary.",
  path: "/projects"
});

export default async function ProjectsPage() {
  const projects = await listProjects({ limit: 12 });

  return (
    <section className="section">
      <div className="hero" style={{ gridTemplateColumns: "1fr" }}>
        <div>
          <h1 className="hero-title">Completed projects</h1>
          <p className="hero-subtitle">
            A snapshot of our latest roofing and exterior work across Calgary.
          </p>
        </div>
      </div>
      <div className="card-grid" style={{ marginTop: 32 }}>
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </section>
  );
}
