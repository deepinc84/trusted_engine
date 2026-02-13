import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProjectSchema from "@/components/ProjectSchema";
import { getProjectBySlug } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: { slug: string } }) {
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

export default async function ProjectDetailPage({ params }: { params: { slug: string } }) {
  const project = await getProjectBySlug(params.slug);
  if (!project) return notFound();

  return (
    <section className="section">
      <ProjectSchema project={project} />
      <div className="hero" style={{ gridTemplateColumns: "1fr" }}>
        <div>
          <span className="badge">{project.service_slug}</span>
          <h1 className="hero-title" style={{ marginTop: 10 }}>{project.title}</h1>
          <p className="hero-subtitle">
            {project.neighborhood ?? "Calgary"}, {project.city}, {project.province}
          </p>
          <p style={{ marginTop: 16 }}>{project.summary}</p>
          {project.description ? <p style={{ marginTop: 12 }}>{project.description}</p> : null}
          {project.completed_at ? (
            <p style={{ marginTop: 12, color: "var(--color-muted)" }}>
              Completed on {project.completed_at}
            </p>
          ) : null}

          <ul style={{ marginTop: 16, paddingLeft: 20 }}>
            <li>Real project node tied to service hub graph.</li>
            <li>Public rounded coordinates only are exposed on public pages.</li>
            <li>Images are stored separately and ordered in gallery.</li>
          </ul>

          <div style={{ marginTop: 18, display: "flex", gap: 12 }}>
            <Link className="button" href={`/services/${project.service_slug}`}>Back to service hub</Link>
            <Link className="button" href="/projects" style={{ background: "white", color: "var(--color-primary)", border: "1px solid rgba(30,58,138,0.2)" }}>
              Back to projects
            </Link>
          </div>
        </div>
      </div>

      <div className="card-grid" style={{ marginTop: 24 }}>
        {(project.photos ?? []).slice(0, 12).map((photo) => (
          <article className="card" key={photo.id}>
            <Image
              src={photo.public_url}
              alt={photo.caption ?? project.title}
              width={960}
              height={720}
              style={{ width: "100%", height: "auto", borderRadius: 12 }}
            />
            {photo.caption ? <p style={{ marginTop: 8, color: "var(--color-muted)" }}>{photo.caption}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
