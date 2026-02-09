import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params
}: {
  params: { slug: string };
}) {
  const project = await getProjectBySlug(params.slug);
  if (!project) {
    return buildMetadata({
      title: "Project not found",
      description: "The requested project could not be found.",
      path: `/projects/${params.slug}`
    });
  }
  return buildMetadata({
    title: project.title,
    description: project.summary,
    path: `/projects/${project.slug}`
  });
}

export default async function ProjectDetailPage({
  params
}: {
  params: { slug: string };
}) {
  const project = await getProjectBySlug(params.slug);
  if (!project) return notFound();

  return (
    <section className="section">
      <div className="hero" style={{ gridTemplateColumns: "1fr" }}>
        <div>
          <span className="badge">{project.service_type}</span>
          <h1 className="hero-title" style={{ marginTop: 12 }}>
            {project.title}
          </h1>
          <p className="hero-subtitle">
            {project.neighborhood}, {project.city}, {project.province}
          </p>
          <p style={{ marginTop: 20 }}>{project.description}</p>
          <p style={{ marginTop: 12, color: "var(--color-muted)" }}>
            Completed on {project.completed_at}
          </p>
        </div>
      </div>
    </section>
  );
}
