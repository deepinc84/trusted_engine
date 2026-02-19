"use client";

import { useMemo, useState } from "react";
import type { Project, Service } from "@/lib/db";

type Props = {
  services: Service[];
  mode: "create" | "edit";
  project?: Project;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ProjectForm({ services, mode, project }: Props) {
  const [title, setTitle] = useState(project?.title ?? "");
  const [slug, setSlug] = useState(project?.slug ?? "");
  const [serviceSlug, setServiceSlug] = useState(project?.service_slug ?? services[0]?.slug ?? "roofing");
  const [neighborhood, setNeighborhood] = useState(project?.neighborhood ?? "");
  const [quadrant, setQuadrant] = useState(project?.quadrant ?? "");
  const [latPrivate, setLatPrivate] = useState(project?.lat_private?.toString() ?? "");
  const [lngPrivate, setLngPrivate] = useState(project?.lng_private?.toString() ?? "");
  const [summary, setSummary] = useState(project?.summary ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [completedAt, setCompletedAt] = useState(project?.completed_at ?? "");
  const [projectId, setProjectId] = useState(project?.id ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);

  const generatedSlug = useMemo(() => {
    if (!title) return "";
    const datePart = completedAt || new Date().toISOString().slice(0, 10);
    return slugify(`${title}-${neighborhood}-${datePart}`);
  }, [title, neighborhood, completedAt]);

  const submit = async () => {
    setStatus(null);

    const payload = {
      title,
      slug: slug || generatedSlug,
      service_slug: serviceSlug,
      neighborhood: neighborhood || null,
      quadrant: quadrant || null,
      lat_private: latPrivate ? Number(latPrivate) : null,
      lng_private: lngPrivate ? Number(lngPrivate) : null,
      summary,
      description: description || null,
      completed_at: completedAt || null,
      city: "Calgary",
      province: "AB",
      is_published: true
    };

    const url = mode === "create" ? "/admin/projects" : `/admin/projects/${project?.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error ?? "Unable to save project.");
      return;
    }

    const id = data.project?.id as string;
    setProjectId(id);
    setStatus("Project saved.");
  };

  const uploadPhotos = async () => {
    if (!projectId || !files?.length) return;
    setUploading(true);

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const form = new FormData();
      form.set("project_id", projectId);
      form.set("file", file);
      form.set("caption", file.name);
      form.set("sort_order", String(index));
      const res = await fetch("/admin/upload", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json();
        setStatus(data.error ?? "Upload failed.");
        setUploading(false);
        return;
      }
    }

    setUploading(false);
    setStatus("Project photos uploaded.");
  };

  return (
    <div className="card" style={{ display: "grid", gap: 12 }}>
      <label>
        Title
        <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label>
        Slug
        <input className="input" value={slug} onChange={(event) => setSlug(event.target.value)} placeholder={generatedSlug} />
      </label>
      <label>
        Service
        <select className="input" value={serviceSlug} onChange={(event) => setServiceSlug(event.target.value)}>
          {services.map((service) => (
            <option key={service.slug} value={service.slug}>
              {service.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        Neighborhood
        <input className="input" value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} />
      </label>
      <label>
        Quadrant
        <select className="input" value={quadrant} onChange={(event) => setQuadrant(event.target.value)}>
          <option value="">Unspecified</option>
          <option value="NE">NE</option>
          <option value="NW">NW</option>
          <option value="SE">SE</option>
          <option value="SW">SW</option>
        </select>
      </label>
      <label>
        Latitude (private)
        <input className="input" value={latPrivate} onChange={(event) => setLatPrivate(event.target.value)} />
      </label>
      <label>
        Longitude (private)
        <input className="input" value={lngPrivate} onChange={(event) => setLngPrivate(event.target.value)} />
      </label>
      <label>
        Summary (2-6 sentences)
        <textarea className="input" value={summary} onChange={(event) => setSummary(event.target.value)} rows={5} />
      </label>
      <label>
        Description
        <textarea className="input" value={description} onChange={(event) => setDescription(event.target.value)} rows={6} />
      </label>
      <label>
        Completed at
        <input className="input" type="date" value={completedAt} onChange={(event) => setCompletedAt(event.target.value)} />
      </label>
      <button className="button" type="button" onClick={() => void submit()}>
        {mode === "create" ? "Create project" : "Update project"}
      </button>

      <hr />
      <label>
        Upload multiple photos
        <input type="file" multiple onChange={(event) => setFiles(event.target.files)} />
      </label>
      <button className="button" type="button" onClick={() => void uploadPhotos()} disabled={!projectId || uploading}>
        {uploading ? "Uploading..." : "Upload photos"}
      </button>

      {status ? <p style={{ margin: 0 }}>{status}</p> : null}
    </div>
  );
}
