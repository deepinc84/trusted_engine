"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ProjectCard from "@/components/ProjectCard";
import NeighborhoodChips from "@/components/ui/NeighborhoodChips";
import type { Project, Service } from "@/lib/db";

type ProjectsExplorerProps = {
  projects: Project[];
  services: Service[];
  selectedServiceSlug: string | null;
  selectedNeighborhood: string | null;
};

const FEATURED_COUNT = 3;
const BATCH_SIZE = 6;

function toServiceLink(slug: string | null) {
  if (!slug) return "/projects#projects-list";
  return `/projects?service_slug=${encodeURIComponent(slug)}#projects-list`;
}

function toNeighborhoodLink(name: string) {
  return `/projects?neighborhood=${encodeURIComponent(name)}#projects-list`;
}

export default function ProjectsExplorer({
  projects,
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
    if (!trigger || projects.length <= FEATURED_COUNT) return;

    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (!entry?.isIntersecting) return;
      setLoadedCount((current) => Math.min(current + BATCH_SIZE, Math.max(projects.length - FEATURED_COUNT, BATCH_SIZE)));
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
    () => Array.from(new Set(projects.map((project) => project.neighborhood).filter(Boolean))) as string[],
    [projects]
  );

  const neighborhoodChips = neighborhoods.map((name) => ({ label: name, href: toNeighborhoodLink(name) }));

  const featuredProjects = projects.slice(0, FEATURED_COUNT);
  const remainingProjects = projects.slice(FEATURED_COUNT);
  const visibleRemaining = remainingProjects.slice(0, loadedCount);
  const hasMore = loadedCount < remainingProjects.length;

  return (
    <>
      <div>
        <NeighborhoodChips chips={serviceChips} />
        <NeighborhoodChips chips={neighborhoodChips} />
      </div>

      <div id="projects-list" style={{ scrollMarginTop: 120, marginTop: 24 }}>
        {projects.length ? (
          <>
            <article className="ui-card" style={{ marginBottom: 16 }}>
              <h2>Featured projects</h2>
              <p>
                Showing the 3 most recent completed projects first. Use the filters to jump to the service you want.
              </p>
            </article>

            <div className="ui-grid ui-grid--projects">
              {featuredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>

            {visibleRemaining.length > 0 ? (
              <div className="ui-grid ui-grid--projects" style={{ marginTop: 20 }}>
                {visibleRemaining.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : null}

            {hasMore ? <div ref={loadTriggerRef} style={{ height: 1 }} aria-hidden="true" /> : null}
          </>
        ) : (
          <article className="ui-card" style={{ marginTop: 20 }}>
            <h2>Project cards will populate here as more completed work is published</h2>
            <p>
              The structure is in place for project cards, neighbourhood filters, and future data expansion. If you do not see a close
              match yet, the instant quote page is still the fastest way to get a realistic budget range based on comparable completed
              work.
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
