"use client";

import { useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { HomeProject } from "./types";

export default function FeaturedProjects({ projects }: { projects: HomeProject[] }) {
  const sectionId = useId();
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

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
          {projects.map((project) => {
            const isExpanded = expandedProjects[project.id] ?? false;
            const summaryId = `${sectionId}-${project.id}-summary`;

            return (
              <article key={project.id} className="homev3-project-card">
                <Link href={`/projects/${project.slug}`} className="homev3-project-card__image-link" aria-label={`Open ${project.title}`}>
                  <div className="homev3-project-card__image">
                    <Image src={project.image} alt={project.title} fill />
                    <span>{project.neighborhood}</span>
                  </div>
                </Link>
                <div className="homev3-project-card__body">
                  <small>{project.service}</small>
                  <h3>
                    <Link href={`/projects/${project.slug}`}>{project.title}</Link>
                  </h3>
                  <div className="homev3-project-card__summary-wrap" data-expanded={isExpanded}>
                    <p id={summaryId} className="homev3-project-card__summary">
                      {project.summary}
                    </p>
                  </div>
                  <div className="homev3-project-card__actions">
                    <button
                      type="button"
                      className="homev3-project-card__expand"
                      onClick={() => setExpandedProjects((previous) => ({ ...previous, [project.id]: !isExpanded }))}
                      aria-expanded={isExpanded}
                      aria-controls={summaryId}
                    >
                      {isExpanded ? "Collapse details" : "Expand details"}
                    </button>
                    <Link href={`/projects/${project.slug}`} className="quote-card__cta">Open: {project.title}</Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
