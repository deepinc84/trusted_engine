"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
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
  neighborhood: string;
  quadrant: "NE" | "NW" | "SE" | "SW" | "";
  lat: number;
  lng: number;
  source: string;
};

const MAX_UPLOAD_FILES = 30;
const MAX_UPLOAD_MB = 15;
const MAX_UPLOAD_MB_AFTER_COMPRESSION = 8;
const MAX_IMAGE_DIMENSION = 2000;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

let browserSupabaseClient: SupabaseClient | null = null;

function getBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!browserSupabaseClient) browserSupabaseClient = createClient(url, key);
  return browserSupabaseClient;
}

async function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  if (typeof window === "undefined") return null;
  return await new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const width = img.naturalWidth || 0;
      const height = img.naturalHeight || 0;
      URL.revokeObjectURL(objectUrl);
      resolve(width > 0 && height > 0 ? { width, height } : null);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };
    img.src = objectUrl;
  });
}

async function resizeForUpload(file: File): Promise<File> {
  if (typeof window === "undefined") return file;
  if (!ALLOWED_MIME_TYPES.includes(file.type)) return file;
  if (file.size <= 3 * 1024 * 1024 && file.type !== "image/heic" && file.type !== "image/heif") return file;

  if (file.type === "image/gif") return file;

  return await new Promise((resolve) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
      const targetWidth = Math.max(1, Math.round(image.naturalWidth * scale));
      const targetHeight = Math.max(1, Math.round(image.naturalHeight * scale));

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
        return;
      }

      ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            resolve(file);
            return;
          }

          const baseName = file.name.replace(/\.[^.]+$/, "");
          const converted = new File([blob], `${baseName}.webp`, { type: "image/webp" });
          resolve(converted.size < file.size ? converted : file);
        },
        "image/webp",
        0.82
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    image.src = objectUrl;
  });
}

function parseJsonSafe<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}


function inferQuadrantFromAddress(value: string) {
  const source = value.toUpperCase();
  if (/\bSOUTH\s*EAST\b|\bSOUTHEAST\b|\bSE\b/.test(source)) return "SE";
  if (/\bSOUTH\s*WEST\b|\bSOUTHWEST\b|\bSW\b/.test(source)) return "SW";
  if (/\bNORTH\s*EAST\b|\bNORTHEAST\b|\bNE\b/.test(source)) return "NE";
  if (/\bNORTH\s*WEST\b|\bNORTHWEST\b|\bNW\b/.test(source)) return "NW";
  return "";
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
  const [completedAt, setCompletedAt] = useState(project?.completed_at ?? (mode === "create" ? new Date().toISOString().slice(0, 10) : ""));
  const [linkedQuoteIds, setLinkedQuoteIds] = useState("");
  const [quotedMaterialCost, setQuotedMaterialCost] = useState(project?.quoted_material_cost?.toString() ?? "");
  const [quotedSubcontractorCost, setQuotedSubcontractorCost] = useState(project?.quoted_subcontractor_cost?.toString() ?? "");
  const [quotedLaborCost, setQuotedLaborCost] = useState(project?.quoted_labor_cost?.toString() ?? "");
  const [quotedEquipmentCost, setQuotedEquipmentCost] = useState(project?.quoted_equipment_cost?.toString() ?? "");
  const [quotedDisposalCost, setQuotedDisposalCost] = useState(project?.quoted_disposal_cost?.toString() ?? "");
  const [quotedPermitCost, setQuotedPermitCost] = useState(project?.quoted_permit_cost?.toString() ?? "");
  const [quotedOtherCost, setQuotedOtherCost] = useState(project?.quoted_other_cost?.toString() ?? "");
  const [quotedSalePrice, setQuotedSalePrice] = useState(project?.quoted_sale_price?.toString() ?? "");
  const [actualMaterialCost, setActualMaterialCost] = useState(project?.actual_material_cost?.toString() ?? "");
  const [actualSubcontractorCost, setActualSubcontractorCost] = useState(project?.actual_subcontractor_cost?.toString() ?? "");
  const [actualLaborCost, setActualLaborCost] = useState(project?.actual_labor_cost?.toString() ?? "");
  const [actualEquipmentCost, setActualEquipmentCost] = useState(project?.actual_equipment_cost?.toString() ?? "");
  const [actualDisposalCost, setActualDisposalCost] = useState(project?.actual_disposal_cost?.toString() ?? "");
  const [actualPermitCost, setActualPermitCost] = useState(project?.actual_permit_cost?.toString() ?? "");
  const [actualOtherCost, setActualOtherCost] = useState(project?.actual_other_cost?.toString() ?? "");
  const [actualSalePrice, setActualSalePrice] = useState(project?.actual_sale_price?.toString() ?? "");
  const [projectId, setProjectId] = useState(project?.id ?? "");
  const [geocodeSource, setGeocodeSource] = useState(project?.geocode_source ?? "manual");
  const [locationMode, setLocationMode] = useState<"current" | "manual">("current");
  const [status, setStatus] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"info" | "success" | "error">("info");
  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);
  const [publishingGeoPost, setPublishingGeoPost] = useState(false);
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

  const setFeedback = (message: string, tone: "info" | "success" | "error" = "info") => {
    setStatus(message);
    setStatusTone(tone);
  };

  const geocodeAddress = async () => {
    if (!addressPrivate.trim()) {
      setFeedback("Enter an address to geocode.", "error");
      return;
    }

    setGeocoding(true);
    setStatus(null);

    const query = new URLSearchParams({ address: addressPrivate });
    const response = await fetch(`/api/geocode?${query.toString()}`);
    const payload = (await response.json()) as { ok?: boolean; result?: GeocodeResult | null; error?: string };

    setGeocoding(false);

    if (!response.ok || !payload.ok || !payload.result) {
      setFeedback(payload.error ?? "Unable to geocode this address. You can still enter lat/lng manually.", "error");
      return;
    }

    setAddressPrivate(payload.result.fullAddress);
    setLatPrivate(String(payload.result.lat));
    setLngPrivate(String(payload.result.lng));
    if (payload.result.neighborhood) setNeighborhood(payload.result.neighborhood);
    const detectedQuadrant = payload.result.quadrant || inferQuadrantFromAddress(payload.result.fullAddress);
    if (detectedQuadrant) setQuadrant(detectedQuadrant);
    setGeocodeSource(payload.result.source || "api");
    setFeedback(`Address matched via ${payload.result.source}. You can edit any field before saving.`, "success");
  };

  const useCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setFeedback("Geolocation is not available in this browser. You can enter address manually.", "error");
      return;
    }

    setLocating(true);
    setFeedback("Detecting your current location...");

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
          if (payload.result.neighborhood) {
            setNeighborhood(payload.result.neighborhood);
          } else if (!neighborhood) {
            setNeighborhood("");
          }
          const detectedQuadrant = payload.result.quadrant || inferQuadrantFromAddress(payload.result.fullAddress);
          if (detectedQuadrant) setQuadrant(detectedQuadrant);
          setFeedback(`Location captured: ${payload.result.fullAddress}`, "success");
        } else {
          setFeedback("Coordinates captured from current location. Add address manually if needed.", "success");
        }

        setLocating(false);
      },
      () => {
        setFeedback("Location permission denied or unavailable. You can enter address manually.", "error");
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
    if (quadrant) return;
    const detected = inferQuadrantFromAddress(addressPrivate);
    if (detected) setQuadrant(detected);
  }, [addressPrivate, quadrant]);

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
    setIsSaving(true);
    setFeedback(mode === "create" ? "Creating project..." : "Updating project...");

    const toNumber = (value: string) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

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
      instant_quote_ids: linkedQuoteIds.split(",").map((value) => value.trim()).filter(Boolean),
      quoted_material_cost: toNumber(quotedMaterialCost),
      quoted_subcontractor_cost: toNumber(quotedSubcontractorCost),
      quoted_labor_cost: toNumber(quotedLaborCost),
      quoted_equipment_cost: toNumber(quotedEquipmentCost),
      quoted_disposal_cost: toNumber(quotedDisposalCost),
      quoted_permit_cost: toNumber(quotedPermitCost),
      quoted_other_cost: toNumber(quotedOtherCost),
      quoted_sale_price: toNumber(quotedSalePrice),
      actual_material_cost: toNumber(actualMaterialCost),
      actual_subcontractor_cost: toNumber(actualSubcontractorCost),
      actual_labor_cost: toNumber(actualLaborCost),
      actual_equipment_cost: toNumber(actualEquipmentCost),
      actual_disposal_cost: toNumber(actualDisposalCost),
      actual_permit_cost: toNumber(actualPermitCost),
      actual_other_cost: toNumber(actualOtherCost),
      actual_sale_price: toNumber(actualSalePrice),
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
      setFeedback(data.error ?? `Unable to save project (HTTP ${res.status}).`, "error");
      setIsSaving(false);
      return;
    }

    const id = data.project?.id as string;
    setProjectId(id);
    if (data.project?.photos) {
      setUploadedPhotos(data.project.photos as ProjectPhoto[]);
    }
      setFeedback("Project saved. You can upload photos now.", "success");

      if (selectedFiles.length > 0) {
        await uploadPhotos(id);
      }

      setIsSaving(false);
    } catch {
      setFeedback("Unable to save project right now. Please refresh and try again.", "error");
      setIsSaving(false);
    }
  };

  const onSelectFiles = (list: FileList | null) => {
    if (!list) {
      setFiles(null);
      return;
    }

    const asArray = Array.from(list);
    if (asArray.length > MAX_UPLOAD_FILES) {
      setFeedback(`Please select up to ${MAX_UPLOAD_FILES} images per upload.`, "error");
      setFiles(null);
      return;
    }

    const unsupported = asArray.find((file) => !ALLOWED_MIME_TYPES.includes(file.type));
    if (unsupported) {
      setFeedback(`Unsupported format for ${unsupported.name}. Use JPG, PNG, WEBP, or GIF.`, "error");
      setFiles(null);
      return;
    }

    const tooLarge = asArray.find((file) => file.size > MAX_UPLOAD_MB * 1024 * 1024);
    if (tooLarge) {
      setFeedback(`${tooLarge.name} is larger than ${MAX_UPLOAD_MB}MB. We'll compress large photos, but this file is too large to process reliably.`, "error");
      setFiles(null);
      return;
    }

    setFiles(list);
    setFeedback(`${asArray.length} image(s) selected. Large photos will be resized before upload.`, "info");
  };

  const uploadPhotos = async (targetProjectId?: string) => {
    const effectiveProjectId = targetProjectId ?? projectId;
    if (!effectiveProjectId || !selectedFiles.length) return;

    const supabaseClient = getBrowserSupabaseClient();

    setUploading(true);
    setUploadProgress({ current: 0, total: selectedFiles.length });

    try {
      const created: ProjectPhoto[] = [];
      const nextSortStart = uploadedPhotos.length;
      for (let index = 0; index < selectedFiles.length; index += 1) {
        setUploadProgress({ current: index + 1, total: selectedFiles.length });

        const originalFile = selectedFiles[index];
        const uploadFile = await resizeForUpload(originalFile);

        if (uploadFile.size > MAX_UPLOAD_MB_AFTER_COMPRESSION * 1024 * 1024) {
          setFeedback(`${originalFile.name} is still over ${MAX_UPLOAD_MB_AFTER_COMPRESSION}MB after compression. Please use a smaller image.`, "error");
          setUploading(false);
          setUploadProgress(null);
          return;
        }

        if (!supabaseClient) {
          setFeedback("Direct upload requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. Configure them and try again.", "error");
          setUploading(false);
          setUploadProgress(null);
          return;
        }

        const signRes = await adminFetch("/admin/upload/signed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: effectiveProjectId,
            file_name: uploadFile.name,
            content_type: uploadFile.type
          })
        });

        const signText = await signRes.text();
        const signData = signText ? parseJsonSafe<{ error?: string; bucket?: string; path?: string; token?: string; public_url?: string }>(signText) : {};
        if (!signRes.ok || !signData.bucket || !signData.path || !signData.token || !signData.public_url) {
          setFeedback(signData.error ?? `Unable to initialize direct upload (HTTP ${signRes.status}).`, "error");
          setUploading(false);
          setUploadProgress(null);
          return;
        }

        const { error: uploadError } = await supabaseClient.storage
          .from(signData.bucket)
          .uploadToSignedUrl(signData.path, signData.token, uploadFile, { upsert: false, contentType: uploadFile.type || "application/octet-stream" });

        if (uploadError) {
          const hint = uploadError.message.toLowerCase().includes("payload too large")
            ? "Image is still too large after optimization. Try a lower-resolution photo."
            : uploadError.message;
          setFeedback(`Direct upload failed for ${originalFile.name}: ${hint}`, "error");
          setUploading(false);
          setUploadProgress(null);
          return;
        }

        const dimensions = await getImageDimensions(uploadFile);

        const finalizeRes = await adminFetch("/admin/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: effectiveProjectId,
            file_name: originalFile.name,
            storage_provider: "supabase",
            storage_bucket: signData.bucket,
            storage_path: signData.path,
            public_url: signData.public_url,
            file_size: uploadFile.size,
            mime_type: uploadFile.type || "application/octet-stream",
            width: dimensions?.width ?? null,
            height: dimensions?.height ?? null,
            caption: "",
            service_slug: serviceSlug,
            neighborhood: neighborhood || null,
            city: "Calgary",
            sequence: nextSortStart + index + 1,
            sort_order: nextSortStart + index,
            is_primary: index === primaryUploadIndex,
            address_private: addressPrivate || "",
            geocode_source: geocodeSource || "manual",
            lat_private: latPrivate || null,
            lng_private: lngPrivate || null
          })
        });

        const finalizeText = await finalizeRes.text();
        const finalizeData = finalizeText ? parseJsonSafe<{ error?: string; photo?: ProjectPhoto }>(finalizeText) : {};
        if (!finalizeRes.ok) {
          setFeedback(finalizeData.error ?? `Upload record creation failed (HTTP ${finalizeRes.status}).`, "error");
          setUploading(false);
          setUploadProgress(null);
          return;
        }

        if (finalizeData.photo) created.push(finalizeData.photo as ProjectPhoto);
      }

      setUploadedPhotos((current) => {
        const merged = [...created, ...current.filter((photo) => !created.some((newPhoto) => newPhoto.id === photo.id))];
        return merged.sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order);
      });

      setUploading(false);
      setUploadProgress(null);
      setFiles(null);
      setFeedback("Project photos uploaded successfully (direct to storage). Set a primary image, then publish the geo-post.", "success");
    } catch {
      setUploading(false);
      setUploadProgress(null);
      setFeedback("Upload failed due to a network/auth issue. Reload admin with ?token=... and try again.", "error");
    }
  };


  const publishGeoPost = async () => {
    if (!projectId) return;
    setPublishingGeoPost(true);
    try {
      const res = await adminFetch(`/admin/projects/${projectId}/geo-post`, { method: "POST" });
      const text = await res.text();
      const data = text ? parseJsonSafe<{ error?: string }>(text) : {};
      if (!res.ok) {
        setFeedback(data.error ?? `Unable to publish geo-post (HTTP ${res.status}).`, "error");
        setPublishingGeoPost(false);
        return;
      }
      setFeedback("Geo-post published from current project + primary image.", "success");
      setPublishingGeoPost(false);
    } catch {
      setFeedback("Unable to publish geo-post right now.", "error");
      setPublishingGeoPost(false);
    }
  };

  const setPrimary = async (photoId: string) => {
    if (!projectId) return;

    setSettingPrimaryId(photoId);
    try {
      const res = await adminFetch(`/admin/photos/${photoId}/primary`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId })
    });

    if (!res.ok) {
      const text = await res.text();
      const data = text ? parseJsonSafe<{ error?: string }>(text) : {};
      setFeedback(data.error ?? `Unable to set primary image (HTTP ${res.status}).`, "error");
      setSettingPrimaryId(null);
      return;
    }

      setUploadedPhotos((current) =>
        current
          .map((photo) => ({ ...photo, is_primary: photo.id === photoId }))
          .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
      );
      setFeedback("Primary image updated.", "success");
      setSettingPrimaryId(null);
    } catch {
      setFeedback("Unable to update primary image right now.", "error");
      setSettingPrimaryId(null);
    }
  };

  return (
    <div className="card" style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 28 }}>{mode === "create" ? "Create Project" : "Edit Project"}</h2>
        <Link href="/admin" className="button" style={{ textDecoration: "none" }}>
          ← Back to projects
        </Link>
      </div>
      <p style={{ margin: 0, color: "var(--color-muted)" }}>
        Create the project first, then upload photos, choose a primary image, and publish the linked geo-post when ready.
      </p>

      {status ? (
        <div className={`admin-status admin-status--${statusTone}`} role="status" aria-live="polite">
          {status}
        </div>
      ) : null}

      <label>
        Title
        <input
          className="input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What was the main high-ticket item? (e.g., Full Hardie Siding Replacement, Class 4 Shingle Upgrade, 6-inch Continuous Eaves)."
        />
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
        <textarea
          className="input input--multiline"
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          rows={5}
          placeholder="Why did the homeowner call us and what did we do to fix their specific problem? (e.g., Old vinyl was melting/warping; we stripped it to the studs and upgraded to fiber cement for better fire and wind resistance)."
        />
      </label>
      <label>
        Description
        <textarea
          className="input input--multiline"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={6}
          placeholder="List 4–6 literal steps taken on-site. Start with a verb. (e.g., Removed old cedar shakes, Inspected roof deck for rot, Installed synthetic underlayment, Hand-nailed shingles, Cleaned gutters)."
        />
      </label>
      <label>
        Completed at
        <input className="input" type="date" value={completedAt} onChange={(event) => setCompletedAt(event.target.value)} />
      </label>
      <label>
        Linked instant quote IDs (comma-separated)
        <input
          className="input"
          value={linkedQuoteIds}
          onChange={(event) => setLinkedQuoteIds(event.target.value)}
          placeholder="uuid-1, uuid-2"
        />
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, alignItems: "start" }}>
        <section className="ui-card" style={{ padding: 16, display: "grid", gap: 10 }}>
          <h3 style={{ margin: 0 }}>Quote data</h3>
          <label>Quoted sale price<input className="input" value={quotedSalePrice} onChange={(event) => setQuotedSalePrice(event.target.value)} /></label>
          <label>Quoted material cost<input className="input" value={quotedMaterialCost} onChange={(event) => setQuotedMaterialCost(event.target.value)} /></label>
          <label>Quoted subcontractor cost<input className="input" value={quotedSubcontractorCost} onChange={(event) => setQuotedSubcontractorCost(event.target.value)} /></label>
          <label>Quoted disposal cost<input className="input" value={quotedDisposalCost} onChange={(event) => setQuotedDisposalCost(event.target.value)} /></label>
          <label>Quoted other cost<input className="input" value={quotedOtherCost} onChange={(event) => setQuotedOtherCost(event.target.value)} /></label>
        </section>

        <section className="ui-card" style={{ padding: 16, display: "grid", gap: 10 }}>
          <h3 style={{ margin: 0 }}>Actual data</h3>
          <label>Actual sale price<input className="input" value={actualSalePrice} onChange={(event) => setActualSalePrice(event.target.value)} /></label>
          <label>Actual material cost<input className="input" value={actualMaterialCost} onChange={(event) => setActualMaterialCost(event.target.value)} /></label>
          <label>Actual subcontractor cost<input className="input" value={actualSubcontractorCost} onChange={(event) => setActualSubcontractorCost(event.target.value)} /></label>
          <label>Actual disposal cost<input className="input" value={actualDisposalCost} onChange={(event) => setActualDisposalCost(event.target.value)} /></label>
          <label>Actual other cost<input className="input" value={actualOtherCost} onChange={(event) => setActualOtherCost(event.target.value)} /></label>
        </section>
      </div>

      <button className="button" type="button" onClick={() => void submit()} disabled={isSaving}>
        {isSaving ? (mode === "create" ? "Creating project..." : "Updating project...") : (mode === "create" ? "Create project" : "Update project")}
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
        {uploading ? `Uploading ${uploadProgress?.current ?? 0}/${uploadProgress?.total ?? selectedFiles.length}...` : "Upload photos"}
      </button>

      <button
        className="button"
        type="button"
        onClick={() => void publishGeoPost()}
        disabled={!projectId || publishingGeoPost || uploadedPhotos.length === 0}
      >
        {publishingGeoPost ? "Publishing geo-post..." : "Publish linked geo-post"}
      </button>

      {uploadedPhotos.length ? (
        <div style={{ display: "grid", gap: 10 }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Uploaded photos</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            {uploadedPhotos.map((photo) => (
              <div key={photo.id} style={{ border: "1px solid #d5d9e2", borderRadius: 8, padding: 8 }}>
                <img src={photo.public_url} alt={photo.caption ?? "Project photo"} style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 6 }} />
                <p style={{ margin: "8px 0 6px", fontSize: 12 }}>{photo.caption ?? "Untitled"}</p>
                <button className="button" type="button" onClick={() => void setPrimary(photo.id)} style={{ width: "100%" }} disabled={settingPrimaryId === photo.id}>
                  {settingPrimaryId === photo.id ? "Saving..." : (photo.is_primary ? "Primary image" : "Set as primary")}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

    </div>
  );
}
