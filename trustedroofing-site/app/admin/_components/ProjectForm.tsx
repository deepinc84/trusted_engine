"use client";

import { useEffect, useMemo, useState } from "react";
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

const MAX_UPLOAD_FILES = 30;
const MAX_UPLOAD_MB = 15;


function parseJsonSafe<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

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
  const [locationMode, setLocationMode] = useState<"current" | "manual">("current");
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [primaryUploadIndex, setPrimaryUploadIndex] = useState(0);
  const [uploadedPhotos, setUploadedPhotos] = useState<ProjectPhoto[]>(project?.photos ?? []);
  const [adminToken, setAdminToken] = useState<string>("");

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

  const useCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("Geolocation is not available in this browser. You can enter address manually.");
      return;
    }

    setLocating(true);
    setStatus("Detecting your current location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setLatPrivate(String(lat));
        setLngPrivate(String(lng));
        setGeocodeSource("browser_geolocation");

        const query = new URLSearchParams({ lat: String(lat), lng: String(lng) });
        const response = await fetch(`/api/geocode?${query.toString()}`);
        const payload = (await response.json()) as { ok?: boolean; result?: GeocodeResult | null };

        if (response.ok && payload.ok && payload.result) {
          setAddressPrivate(payload.result.fullAddress);
          if (!neighborhood) setNeighborhood(payload.result.city || "");
          setStatus(`Location captured: ${payload.result.fullAddress}`);
        } else {
          setStatus("Coordinates captured from current location. Add address manually if needed.");
        }

        setLocating(false);
      },
      () => {
        setStatus("Location permission denied or unavailable. You can enter address manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    if (mode === "create" && locationMode === "current" && !project?.lat_private) {
      useCurrentLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    if (typeof window === "undefined") return;

    const fromQuery = new URLSearchParams(window.location.search).get("token");
    const fromStorage = window.localStorage.getItem("admin_token") ?? "";
    const token = fromQuery || fromStorage;
    if (!token) return;

    setAdminToken(token);
    if (fromQuery && fromQuery !== fromStorage) {
      window.localStorage.setItem("admin_token", fromQuery);
    }
  }, []);

  const adminFetch = (url: string, init?: RequestInit) => {
    const headers = new Headers(init?.headers ?? {});
    if (adminToken) headers.set("x-admin-token", adminToken);
    return fetch(url, { ...init, headers });
  };

  const submit = async () => {
    setStatus(null);

    try {
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

    const res = await adminFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    const data = text ? parseJsonSafe<{ error?: string; project?: Project }>(text) : {};
    if (!res.ok) {
      setStatus(data.error ?? "Unable to save project.");
      return;
    }

    const id = data.project?.id as string;
    setProjectId(id);
    if (data.project?.photos) {
      setUploadedPhotos(data.project.photos as ProjectPhoto[]);
    }
      setStatus("Project saved. You can upload photos now.");
    } catch {
      setStatus("Unable to save project right now. Please refresh and try again.");
    }
  };

  const onSelectFiles = (list: FileList | null) => {
    if (!list) {
      setFiles(null);
      return;
    }

    const asArray = Array.from(list);
    if (asArray.length > MAX_UPLOAD_FILES) {
      setStatus(`Please select up to ${MAX_UPLOAD_FILES} images per upload.`);
      setFiles(null);
      return;
    }

    const tooLarge = asArray.find((file) => file.size > MAX_UPLOAD_MB * 1024 * 1024);
    if (tooLarge) {
      setStatus(`${tooLarge.name} is larger than ${MAX_UPLOAD_MB}MB. Please resize and try again.`);
      setFiles(null);
      return;
    }

    setFiles(list);
    setStatus(`${asArray.length} image(s) selected.`);
  };

  const uploadPhotos = async () => {
    if (!projectId || !selectedFiles.length) return;
    setUploading(true);

    try {
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

      const res = await adminFetch("/admin/upload", { method: "POST", body: form });
      const text = await res.text();
      const data = text ? parseJsonSafe<{ error?: string; photo?: ProjectPhoto }>(text) : {};
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
      setFiles(null);
      setStatus("Project photos uploaded and geo-tagged from project location.");
    } catch {
      setUploading(false);
      setStatus("Upload failed due to a network or auth issue. Reload admin with ?token=... and try again.");
    }
  };

  const setPrimary = async (photoId: string) => {
    if (!projectId) return;

    try {
      const res = await adminFetch(`/admin/photos/${photoId}/primary`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId })
    });

    if (!res.ok) {
      const text = await res.text();
      const data = text ? parseJsonSafe<{ error?: string }>(text) : {};
      setStatus(data.error ?? "Unable to set primary image.");
      return;
    }

      setUploadedPhotos((current) =>
        current
          .map((photo) => ({ ...photo, is_primary: photo.id === photoId }))
          .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
      );
      setStatus("Primary image updated.");
    } catch {
      setStatus("Unable to update primary image right now.");
    }
  };

  return (
    <div className="card" style={{ display: "grid", gap: 14 }}>
      <h2 style={{ margin: 0, fontSize: 28 }}>Create Geo-Tagged Post</h2>
      <p style={{ margin: 0, color: "var(--color-muted)" }}>
        Use your current location by default, or switch to manual address mode.
      </p>

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

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          className="button"
          type="button"
          style={{ opacity: locationMode === "current" ? 1 : 0.8 }}
          onClick={() => {
            setLocationMode("current");
            useCurrentLocation();
          }}
          disabled={locating}
        >
          {locating ? "Locating..." : "Use my current location"}
        </button>
        <button
          className="button"
          type="button"
          style={{ background: locationMode === "manual" ? "var(--color-primary)" : "white", color: locationMode === "manual" ? "white" : "var(--color-primary)", border: "1px solid rgba(30,58,138,0.25)" }}
          onClick={() => setLocationMode("manual")}
        >
          Enter address manually
        </button>
      </div>

      <label>
        Address (private)
        <input
          className="input"
          value={addressPrivate}
          onChange={(event) => setAddressPrivate(event.target.value)}
          placeholder="123 Main St SW, Calgary AB"
          disabled={locationMode === "current" && locating}
        />
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
        Upload project photos (up to {MAX_UPLOAD_FILES} files, {MAX_UPLOAD_MB}MB each)
        <input type="file" multiple accept="image/*" onChange={(event) => onSelectFiles(event.target.files)} />
      </label>

      {selectedFiles.length ? (
        <div style={{ display: "grid", gap: 10 }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Preview + choose main post image</p>
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
