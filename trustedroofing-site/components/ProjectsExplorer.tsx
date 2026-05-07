"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ProjectCard from "@/components/ProjectCard";
import NeighborhoodChips from "@/components/ui/NeighborhoodChips";
import type { Project, Service } from "@/lib/db";

type ProjectsExplorerProps = {
  projects: Project[];
  filterProjects: Project[];
  services: Service[];
  selectedServiceSlug: string | null;
  selectedNeighborhood: string | null;
};

const BATCH_SIZE = 6;
const PROJECTS_ANCHOR = "remaining-projects";

function toServiceLink(slug: string | null) {
  if (!slug) return `/projects#${PROJECTS_ANCHOR}`;
  return `/projects?service_slug=${encodeURIComponent(slug)}#${PROJECTS_ANCHOR}`;
}

function toNeighborhoodLink(name: string) {
  return `/projects?neighborhood=${encodeURIComponent(name)}#${PROJECTS_ANCHOR}`;
}

export default function ProjectsExplorer({
  projects,
  filterProjects,
  services,
  selectedServiceSlug,
  selectedNeighborhood
}: ProjectsExplorerProps) {
  const [loadedCount, setLoadedCount] = useState(BATCH_SIZE);
  const loadTriggerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLoadedCount(BATCH_SIZE);
  }, [selectedServiceSlug, selectedNeighborhood]);

  useEffect(() => {
    const trigger = loadTriggerRef.current;
    if (!trigger || projects.length <= BATCH_SIZE) return;

    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (!entry?.isIntersecting) return;
      setLoadedCount((current) => Math.min(current + BATCH_SIZE, projects.length));
    }, { rootMargin: "320px" });

    observer.observe(trigger);
    return () => observer.disconnect();
  }, [projects.length]);

  const serviceChips = useMemo(
    () => [
      { label: "All services", href: toServiceLink(null) },
      ...services.map((service) => ({ label: service.title, href: toServiceLink(service.slug) }))
    ],
    [services]
  );

  const neighborhoods = useMemo(
    () => Array.from(new Set(filterProjects.map((project) => project.neighborhood).filter(Boolean))) as string[],
    [filterProjects]
  );

  const neighborhoodChips = neighborhoods.map((name) => ({ label: name, href: toNeighborhoodLink(name) }));

  const visibleProjects = projects.slice(0, loadedCount);
  const hasMore = loadedCount < projects.length;
  const hasActiveFilter = Boolean(selectedServiceSlug || selectedNeighborhood);

  return (
    <>
      <div>
        <NeighborhoodChips chips={serviceChips} />
        <NeighborhoodChips chips={neighborhoodChips} />
      </div>

      <div id={PROJECTS_ANCHOR} style={{ scrollMarginTop: 120, marginTop: 24 }}>
        <article className="ui-card" style={{ marginBottom: 16 }}>
          <h2>{hasActiveFilter ? "Filtered project database" : "More completed projects"}</h2>
          <p>
            {hasActiveFilter
              ? "Showing matching projects from the full project database. Clear filters to return to the remaining completed projects."
              : "Browse the remaining completed projects after the featured examples above."}
          </p>
        </article>

        {projects.length ? (
          <>
            <div className="ui-grid ui-grid--projects">
              {visibleProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>

            {hasMore ? <div ref={loadTriggerRef} style={{ height: 1 }} aria-hidden="true" /> : null}
          </>
        ) : (
          <article className="ui-card" style={{ marginTop: 20 }}>
            <h2>No projects match this filter yet</h2>
            <p>
              The project database is growing. If you do not see a close match yet, the instant quote page is still the fastest way to get
              a realistic budget range based on comparable completed work.
            </p>
            <Link href="/online-estimate" className="button">Start instant quote</Link>
          </article>
        )}
      </div>

      <div style={{ marginTop: 24 }}>
        <NeighborhoodChips chips={serviceChips} />
        <NeighborhoodChips chips={neighborhoodChips} />
      </div>
    </>
  );
}
