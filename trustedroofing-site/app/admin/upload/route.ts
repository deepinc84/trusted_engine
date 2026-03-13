import { NextResponse } from "next/server";
import {
  addProjectPhoto,
  getDataMode,
  setPrimaryProjectPhoto,
  getProjectById
} from "@/lib/db";

function streetFromAddress(address: string) {
  const firstPart = address.split(",")[0]?.trim() ?? "";
  return firstPart.replace(/\b(CALGARY|AB|ALBERTA)\b/gi, "").trim();
}

function buildGeoAltText(input: {
  serviceSlug: string;
  sequence: number;
  street: string | null;
  neighborhood: string | null;
  city: string;
}) {
  const service = input.serviceSlug.replace(/-/g, " ").trim();
  const locationParts = [input.street, input.neighborhood, input.city]
    .map((part) => (part ?? "").trim())
    .filter((part, idx, arr) => part.length > 0 && arr.indexOf(part) === idx);

  const location = locationParts.length ? locationParts.join(", ") : input.city;
  return `${service} project ${String(input.sequence).padStart(2, "0")} - ${location}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const projectId = String(body.project_id ?? "");
    const caption = String(body.caption ?? "");
    const sortOrder = Number(body.sort_order ?? 0);
    const isPrimary = Boolean(body.is_primary);
    const addressPrivate = String(body.address_private ?? "");
    const geocodeSource = String(body.geocode_source ?? "");
    const storagePath = String(body.storage_path ?? "");
    const publicUrl = String(body.public_url ?? "");
    const latPrivate = body.lat_private == null ? null : Number(body.lat_private);
    const lngPrivate = body.lng_private == null ? null : Number(body.lng_private);

    if (!projectId) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }

    if (!storagePath || !publicUrl) {
      return NextResponse.json({ error: "storage_path and public_url are required" }, { status: 400 });
    }

    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const serviceSlug = String(body.service_slug ?? project.service_slug ?? "roofing");
    const neighborhood = String(body.neighborhood ?? project.neighborhood ?? "");
    const city = String(body.city ?? project.city ?? "Calgary");
    const sequence = Number(body.sequence ?? 1);
    const street = streetFromAddress(addressPrivate || project.address_private || "");

    const generatedCaption = caption.trim() || buildGeoAltText({
      serviceSlug,
      sequence: Number.isFinite(sequence) ? sequence : 1,
      street: street || null,
      neighborhood: neighborhood || null,
      city
    });

    const mode = getDataMode();
    const photo = await addProjectPhoto(projectId, {
      storage_provider: String(body.storage_provider ?? (mode === "mock" ? "mock" : "supabase")),
      storage_bucket: body.storage_bucket ? String(body.storage_bucket) : null,
      storage_path: storagePath,
      public_url: publicUrl,
      file_size: body.file_size == null ? null : Number(body.file_size),
      mime_type: body.mime_type ? String(body.mime_type) : null,
      width: body.width == null ? null : Number(body.width),
      height: body.height == null ? null : Number(body.height),
      caption: generatedCaption,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      is_primary: isPrimary,
      address_private: addressPrivate || null,
      lat_private: Number.isFinite(latPrivate as number) ? latPrivate : null,
      lng_private: Number.isFinite(lngPrivate as number) ? lngPrivate : null,
      geocode_source: geocodeSource || null
    });

    if (isPrimary) {
      await setPrimaryProjectPhoto(projectId, photo.id);
    }

    return NextResponse.json({ photo, mode });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload finalization failed." },
      { status: 400 }
    );
  }
}
