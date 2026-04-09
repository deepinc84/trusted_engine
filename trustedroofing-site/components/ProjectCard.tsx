import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/db";
import { getPlaceholderProjectImage } from "@/lib/images";
import { neighborhoodSlug } from "@/lib/serviceAreas";

function titleCase(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function ProjectCard({ project }: { project: Project }) {
  const heroImage = project.photos?.[0]?.public_url ?? getPlaceholderProjectImage({
    seed: project.slug,
    neighborhood: project.neighborhood,
    quadrant: project.quadrant,
    city: project.city
  });
  const neighborhood = project.neighborhood ?? project.city;
  const neighborhoodHref = `/service-areas/${neighborhoodSlug(neighborhood)}`;
  const material = titleCase(project.service_slug);
  const complexity = project.description ? "Specified in brief" : "Not specified";

  return (
    <article className="ui-card ui-card--project seo-card">
      <div className="seo-card__media">
        <Image
          src={heroImage}
          alt={project.title}
          width={640}
          height={400}
          className="ui-card--project__image"
        />
        <div className="seo-card__overlay" aria-hidden="true">
          <p><strong>Complexity:</strong> {complexity}</p>
          <p><strong>Material:</strong> {material}</p>
          <p><strong>Neighborhood:</strong> {neighborhood}</p>
        </div>
      </div>
      <div className="seo-card__content">
        <span className="ui-pill">{project.service_slug}</span>
        <h3>
          <Link href={`/projects/${project.slug}`}>{project.title}</Link>
        </h3>
        <p className="seo-card__eyebrow">{neighborhood}, {project.city}</p>
        <p className="seo-card__summary seo-card__summary--clamped">{project.summary}</p>
        <div className="seo-card__actions">
          <Link href={neighborhoodHref}>Explore {neighborhood}</Link>
        </div>
      </div>
    </article>
  );
}
