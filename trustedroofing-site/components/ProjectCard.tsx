import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/db";
<<<<<<< codex/set-up-foundation-for-trustedroofing-site-bbrh8t
import { getPlaceholderProjectImage } from "@/lib/images";

export default function ProjectCard({ project }: { project: Project }) {
  const heroImage = project.photos?.[0]?.public_url ?? getPlaceholderProjectImage({
    seed: project.slug,
    neighborhood: project.neighborhood,
    quadrant: project.quadrant,
    city: project.city
  });
=======

const fallbackImages = [
  "/projects/project-1.svg",
  "/projects/project-2.svg",
  "/projects/project-3.svg"
];

export default function ProjectCard({ project }: { project: Project }) {
  const heroImage = project.photos?.find((photo) => photo.is_primary)?.public_url
    ?? project.photos?.[0]?.public_url
    ?? fallbackImages[Math.abs(project.slug.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % fallbackImages.length];
>>>>>>> main

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
