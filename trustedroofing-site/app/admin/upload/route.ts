import { NextResponse } from "next/server";
import {
  addProjectPhoto,
  getStorageAdminClient,
  getDataMode,
  setPrimaryProjectPhoto,
  getProjectById
} from "@/lib/db";
import {
  extractImageDimensions,
  getProjectImageStorageProvider,
  uploadProjectImageToSupabase
} from "@/lib/storage";

function humanizeFilename(name: string) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
}

function buildGeoAltText(input: {
  explicitCaption: string;
  filename: string;
  serviceSlug: string;
  neighborhood: string | null;
  city: string;
}) {
  if (input.explicitCaption && input.explicitCaption.toLowerCase() !== input.filename.toLowerCase()) {
    return input.explicitCaption;
  }

  const service = input.serviceSlug.replace(/-/g, " ");
  const area = input.neighborhood ? `${input.neighborhood}, ${input.city}` : input.city;
  const filenameHint = humanizeFilename(input.filename);
  return `Completed ${service} project in ${area}. ${filenameHint}`.trim();
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const projectId = String(form.get("project_id") ?? "");
    const caption = String(form.get("caption") ?? "");
    const sortOrder = Number(form.get("sort_order") ?? 0);
    const isPrimary = String(form.get("is_primary") ?? "false") === "true";
    const project = projectId ? await getProjectById(projectId) : null;
    const addressPrivate = String(form.get("address_private") ?? "");
    const geocodeSource = String(form.get("geocode_source") ?? "");
    const generatedCaption = buildGeoAltText({
      explicitCaption: caption,
      filename: file instanceof File ? file.name : "project-photo",
      serviceSlug: project?.service_slug ?? "roofing",
      neighborhood: project?.neighborhood ?? null,
      city: project?.city ?? "Calgary"
    });
    const latPrivateRaw = form.get("lat_private");
    const lngPrivateRaw = form.get("lng_private");
    const latPrivate = latPrivateRaw ? Number(latPrivateRaw) : null;
    const lngPrivate = lngPrivateRaw ? Number(lngPrivateRaw) : null;

    if (!(file instanceof File) || !projectId) {
      return NextResponse.json({ error: "file and project_id are required" }, { status: 400 });
    }

    const storageProvider = getDataMode() === "mock" ? "mock" : getProjectImageStorageProvider();

    if (storageProvider === "mock" || getDataMode() === "mock") {
      const path = `/uploads/${Date.now()}-${file.name}`;
      const arrayBuffer = await file.arrayBuffer();
      const source = Buffer.from(arrayBuffer);
      const dimensions = extractImageDimensions(source, file.type || "application/octet-stream");

      const photo = await addProjectPhoto(projectId, {
        storage_provider: "mock",
        storage_bucket: null,
        storage_path: path,
        public_url: path,
        file_size: source.byteLength,
        mime_type: file.type || "application/octet-stream",
        width: dimensions?.width ?? null,
        height: dimensions?.height ?? null,
        caption: generatedCaption,
        sort_order: sortOrder,
        is_primary: isPrimary,
        address_private: addressPrivate || null,
        lat_private: Number.isFinite(latPrivate as number) ? latPrivate : null,
        lng_private: Number.isFinite(lngPrivate as number) ? lngPrivate : null,
        geocode_source: geocodeSource || null
      });

      if (isPrimary) {
        await setPrimaryProjectPhoto(projectId, photo.id);
      }

      return NextResponse.json({ photo, mode: "mock" });
    }

    if (storageProvider !== "supabase") {
      return NextResponse.json(
        { error: `Unsupported storage provider: ${storageProvider}` },
        { status: 400 }
      );
    }

    const client = getStorageAdminClient();
    if (!client) {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY is required for uploads." },
        { status: 500 }
      );
    }

    const uploaded = await uploadProjectImageToSupabase({
      client,
      projectId,
      file,
      latPrivate: Number.isFinite(latPrivate as number) ? latPrivate : null,
      lngPrivate: Number.isFinite(lngPrivate as number) ? lngPrivate : null
    });

    const photo = await addProjectPhoto(projectId, {
      storage_provider: uploaded.provider,
      storage_bucket: uploaded.bucket,
      storage_path: uploaded.path,
      public_url: uploaded.public_url,
      file_size: uploaded.file_size,
      mime_type: uploaded.mime_type,
      width: uploaded.width,
      height: uploaded.height,
      caption: generatedCaption,
      sort_order: sortOrder,
      is_primary: isPrimary,
      address_private: addressPrivate || null,
      lat_private: Number.isFinite(latPrivate as number) ? latPrivate : null,
      lng_private: Number.isFinite(lngPrivate as number) ? lngPrivate : null,
      geocode_source: geocodeSource || null
    });

    if (isPrimary) {
      await setPrimaryProjectPhoto(projectId, photo.id);
    }

    return NextResponse.json({ photo });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 }
    );
  }
}
