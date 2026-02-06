"use client";

import { useEffect, useState } from "react";
import ProjectCard from "./ProjectCard";
import type { Project } from "@/lib/db";

type Props = {
  nearLat?: number | null;
  nearLng?: number | null;
  fallbackLabel?: string;
};

export default function ProjectCarousel({
  nearLat,
  nearLng,
  fallbackLabel
}: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [label, setLabel] = useState("Completed projects near you");

  useEffect(() => {
    const params = new URLSearchParams();
    if (nearLat && nearLng) {
      params.set("near_lat", String(nearLat));
      params.set("near_lng", String(nearLng));
      params.set("limit", "6");
    }

    fetch(`/api/projects?${params.toString()}`)
      .then(async (res) => res.json())
      .then((data) => {
        setProjects(data.projects ?? []);
        // TODO: replace with real GeoBoost feed when location intelligence is live.
        if (!nearLat || !nearLng) {
          setLabel(fallbackLabel ?? "Recent projects in Calgary");
        }
      })
      .catch(() => {
        setProjects([]);
      });
  }, [nearLat, nearLng, fallbackLabel]);

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
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </section>
  );
}
