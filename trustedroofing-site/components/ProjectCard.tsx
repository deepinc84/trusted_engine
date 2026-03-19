import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/db";
import { getPlaceholderProjectImage } from "@/lib/images";

export default function ProjectCard({ project }: { project: Project }) {
  const heroImage = project.photos?.[0]?.public_url ?? getPlaceholderProjectImage(project.slug);

  return (
    <article className="ui-card ui-card--project">
      <Image
        src={heroImage}
        alt={project.title}
        width={640}
        height={400}
        className="ui-card--project__image"
      />
      <span className="ui-pill">{project.service_slug}</span>
      <h3>{project.title}</h3>
      <p>{project.neighborhood ?? "Calgary"}, {project.city}</p>
      <p>{project.summary}</p>
      <Link href={`/projects/${project.slug}`}>View project</Link>
    </article>
  );
}
