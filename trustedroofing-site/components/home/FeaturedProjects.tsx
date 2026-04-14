import Image from "next/image";
import Link from "next/link";
import type { HomeProject } from "./types";

export default function FeaturedProjects({ projects }: { projects: HomeProject[] }) {
  return (
    <section className="homev3-section" id="projects">
      <div className="homev3-container">
        <div className="homev3-heading-row">
          <div>
            <p className="homev3-eyebrow homev3-eyebrow--dark">Portfolio</p>
            <h2 className="homev3-title">Featured Calgary projects</h2>
          </div>
          <Link href="/projects" className="button button--ghost">View all projects</Link>
        </div>
        <div className="homev3-projects-grid">
          {projects.map((project) => (
            <article key={project.id} className="homev3-project-card">
              <Link href={`/projects/${project.slug}`} className="seo-card--link">
                <div className="homev3-project-card__image">
                  <Image src={project.image} alt={project.title} fill />
                  <span>{project.neighborhood}</span>
                </div>
                <div className="homev3-project-card__body">
                  <small>{project.service}</small>
                  <h3>{project.title}</h3>
                  <p>{project.summary}</p>
                  <span className="quote-card__cta">Open: {project.title}</span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
