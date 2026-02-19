"use client";

import { useMemo, useState } from "react";
import type { Project, ProjectPhoto, Service } from "@/lib/db";

type Props = {
  services: Service[];
  mode: "create" | "edit";
  project?: Project;
};

type GeocodeResult = {
  fullAddress: string;
  city: string;
  province: string;
  postal: string;
  lat: number;
  lng: number;
  source: string;
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
  const [addressPrivate, setAddressPrivate] = useState(project?.address_private ?? "");
  const [neighborhood, setNeighborhood] = useState(project?.neighborhood ?? "");
  const [quadrant, setQuadrant] = useState(project?.quadrant ?? "");
  const [latPrivate, setLatPrivate] = useState(project?.lat_private?.toString() ?? "");
  const [lngPrivate, setLngPrivate] = useState(project?.lng_private?.toString() ?? "");
  const [summary, setSummary] = useState(project?.summary ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [completedAt, setCompletedAt] = useState(project?.completed_at ?? "");
  const [projectId, setProjectId] = useState(project?.id ?? "");
  const [geocodeSource, setGeocodeSource] = useState(project?.geocode_source ?? "manual");
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [primaryUploadIndex, setPrimaryUploadIndex] = useState(0);
  const [uploadedPhotos, setUploadedPhotos] = useState<ProjectPhoto[]>(project?.photos ?? []);

  const generatedSlug = useMemo(() => {
    if (!title) return "";
    const datePart = completedAt || new Date().toISOString().slice(0, 10);
    return slugify(`${title}-${neighborhood}-${datePart}`);
  }, [title, neighborhood, completedAt]);

  const selectedFiles = useMemo(() => Array.from(files ?? []), [files]);

  const geocodeAddress = async () => {
    if (!addressPrivate.trim()) {
      setStatus("Enter an address to geocode.");
      return;
    }

    setGeocoding(true);
    setStatus(null);

    const query = new URLSearchParams({ address: addressPrivate });
    const response = await fetch(`/api/geocode?${query.toString()}`);
    const payload = (await response.json()) as { ok?: boolean; result?: GeocodeResult | null; error?: string };

    setGeocoding(false);

    if (!response.ok || !payload.ok || !payload.result) {
      setStatus(payload.error ?? "Unable to geocode this address. You can still enter lat/lng manually.");
      return;
    }

    setAddressPrivate(payload.result.fullAddress);
    setLatPrivate(String(payload.result.lat));
    setLngPrivate(String(payload.result.lng));
    setGeocodeSource(payload.result.source || "api");
    setStatus(`Address matched via ${payload.result.source}. You can edit any field before saving.`);
  };

  const submit = async () => {
    setStatus(null);

    const payload = {
      title,
      slug: slug || generatedSlug,
      service_slug: serviceSlug,
      neighborhood: neighborhood || null,
      quadrant: quadrant || null,
      address_private: addressPrivate || null,
      geocode_source: geocodeSource || "manual",
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
    if (data.project?.photos) {
      setUploadedPhotos(data.project.photos as ProjectPhoto[]);
    }
    setStatus("Project saved.");
  };

  const uploadPhotos = async () => {
    if (!projectId || !selectedFiles.length) return;
    setUploading(true);

    const created: ProjectPhoto[] = [];
    for (let index = 0; index < selectedFiles.length; index += 1) {
      const file = selectedFiles[index];
      const form = new FormData();
      form.set("project_id", projectId);
      form.set("file", file);
      form.set("caption", file.name);
      form.set("sort_order", String(index));
      form.set("is_primary", String(index === primaryUploadIndex));
      form.set("address_private", addressPrivate || "");
      form.set("geocode_source", geocodeSource || "manual");
      form.set("lat_private", latPrivate || "");
      form.set("lng_private", lngPrivate || "");

      const res = await fetch("/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error ?? "Upload failed.");
        setUploading(false);
        return;
      }

      if (data.photo) created.push(data.photo as ProjectPhoto);
    }

    setUploadedPhotos((current) => {
      const merged = [...created, ...current.filter((photo) => !created.some((newPhoto) => newPhoto.id === photo.id))];
      return merged.sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order);
    });

    setUploading(false);
    setStatus("Project photos uploaded and geo-tagged from project location.");
  };

  const setPrimary = async (photoId: string) => {
    if (!projectId) return;
    const res = await fetch(`/admin/photos/${photoId}/primary`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId })
    });

    if (!res.ok) {
      const data = await res.json();
      setStatus(data.error ?? "Unable to set primary image.");
      return;
    }

    setUploadedPhotos((current) =>
      current
        .map((photo) => ({ ...photo, is_primary: photo.id === photoId }))
        .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
    );
    setStatus("Primary image updated.");
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
        Address (private)
        <input className="input" value={addressPrivate} onChange={(event) => setAddressPrivate(event.target.value)} placeholder="123 Main St SW, Calgary AB" />
      </label>
      <button className="button" type="button" onClick={() => void geocodeAddress()} disabled={geocoding}>
        {geocoding ? "Geocoding..." : "Auto-fill lat/lng from address"}
      </button>
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
        <input type="file" multiple accept="image/*" onChange={(event) => setFiles(event.target.files)} />
      </label>

      {selectedFiles.length ? (
        <div style={{ display: "grid", gap: 10 }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Preview + select main post image</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            {selectedFiles.map((file, index) => {
              const localUrl = URL.createObjectURL(file);
              return (
                <label key={`${file.name}-${index}`} style={{ border: "1px solid #d5d9e2", borderRadius: 8, padding: 8 }}>
                  <img src={localUrl} alt={file.name} style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 6 }} />
                  <div style={{ marginTop: 8, display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      type="radio"
                      name="primary_upload_photo"
                      checked={primaryUploadIndex === index}
                      onChange={() => setPrimaryUploadIndex(index)}
                    />
                    <span style={{ fontSize: 13 }}>Main image</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}

      <button className="button" type="button" onClick={() => void uploadPhotos()} disabled={!projectId || uploading || !selectedFiles.length}>
        {uploading ? "Uploading..." : "Upload photos"}
      </button>

      {uploadedPhotos.length ? (
        <div style={{ display: "grid", gap: 10 }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Uploaded photos</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            {uploadedPhotos.map((photo) => (
              <div key={photo.id} style={{ border: "1px solid #d5d9e2", borderRadius: 8, padding: 8 }}>
                <img src={photo.public_url} alt={photo.caption ?? "Project photo"} style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 6 }} />
                <p style={{ margin: "8px 0 6px", fontSize: 12 }}>{photo.caption ?? "Untitled"}</p>
                <button className="button" type="button" onClick={() => void setPrimary(photo.id)} style={{ width: "100%" }}>
                  {photo.is_primary ? "Primary image" : "Set as primary"}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {status ? <p style={{ margin: 0 }}>{status}</p> : null}
    </div>
  );
}
