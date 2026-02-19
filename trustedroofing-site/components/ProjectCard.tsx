import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/db";

export default function ProjectCard({ project }: { project: Project }) {
  const heroImage = project.photos?.find((photo) => photo.is_primary)?.public_url ?? project.photos?.[0]?.public_url;

  return (
    <article className="card">
      {heroImage ? (
        <Image
          src={heroImage}
          alt={project.title}
          width={320}
          height={180}
          style={{ width: "100%", height: "auto", borderRadius: 12 }}
        />
      ) : null}
      <div className="badge">{project.service_slug}</div>
      <h3 style={{ marginTop: 12 }}>{project.title}</h3>
      <p style={{ color: "var(--color-muted)", marginTop: 8 }}>
        {project.neighborhood ?? "Calgary"}, {project.city}
      </p>
      <p style={{ marginTop: 12 }}>{project.summary}</p>
      <Link
        href={`/projects/${project.slug}`}
        style={{ marginTop: 16, display: "inline-block", fontWeight: 600 }}
      >
        View project →
      </Link>
    </article>
  );
}
