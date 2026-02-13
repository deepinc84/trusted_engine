"use client";

import { useEffect, useState } from "react";
import ProjectCard from "./ProjectCard";
import type { Project } from "@/lib/db";

type Props = {
  nearLat?: number | null;
  nearLng?: number | null;
  serviceSlug?: string;
  neighborhood?: string;
  fallbackLabel?: string;
  limit?: number;
};

export default function ProjectCarousel({
  nearLat,
  nearLng,
  serviceSlug,
  neighborhood,
  fallbackLabel,
  limit = 5
}: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [label, setLabel] = useState("Completed projects near you");

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (nearLat !== null && nearLat !== undefined && nearLng !== null && nearLng !== undefined) {
      params.set("near_lat", String(nearLat));
      params.set("near_lng", String(nearLng));
    }
    if (serviceSlug) params.set("service_slug", serviceSlug);
    if (neighborhood) params.set("neighborhood", neighborhood);

    fetch(`/api/projects?${params.toString()}`)
      .then(async (res) => res.json())
      .then((data) => {
        setProjects(data.projects ?? []);
        if (nearLat === null || nearLat === undefined || nearLng === null || nearLng === undefined) {
          setLabel(fallbackLabel ?? "Recent projects in Calgary");
        }
      })
      .catch(() => {
        setProjects([]);
      });
  }, [nearLat, nearLng, fallbackLabel, serviceSlug, neighborhood, limit]);

  if (!projects.length) {
    return (
      <div className="card">
        <h3>No nearby projects yet.</h3>
        <p style={{ color: "var(--color-muted)", marginTop: 8 }}>
          We are adding more completed work. Check back soon.
        </p>
      </div>
    );
  }

  return (
    <section>
      <h2 style={{ marginBottom: 16 }}>{label}</h2>
      <div className="carousel">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}
