"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/lib/db";
import ProjectCard from "./ProjectCard";
import { getBrowserLocation } from "@/lib/geo";

export default function GeoProjectsRail({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [label, setLabel] = useState("Recent projects in Calgary");

  useEffect(() => {
    getBrowserLocation()
      .then(async (coords) => {
        const params = new URLSearchParams({
          near_lat: String(coords.lat),
          near_lng: String(coords.lng),
          limit: "5"
        });
        const res = await fetch(`/api/projects?${params.toString()}`);
        const data = await res.json();
        setProjects(data.projects ?? initialProjects);
        setLabel("Completed projects near you");
      })
      .catch(() => {
        setLabel("Recent projects in Calgary");
      });
  }, [initialProjects]);

  if (!projects.length) {
    return (
      <div className="card">
        <h3>No published projects yet.</h3>
        <p style={{ color: "var(--color-muted)", marginTop: 8 }}>
          Publish your first project from the admin area.
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
