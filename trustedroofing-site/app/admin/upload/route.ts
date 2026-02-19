import { NextResponse } from "next/server";
import {
  addProjectPhoto,
  getStorageAdminClient,
  getDataMode,
  setPrimaryProjectPhoto,
  getProjectById
} from "@/lib/db";

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

  if (getDataMode() === "mock") {
    const mockUrl = `/uploads/${Date.now()}-${file.name}`;
    const photo = await addProjectPhoto(projectId, {
      storage_path: mockUrl,
      public_url: mockUrl,
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

  const client = getStorageAdminClient();
  if (!client) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is required for uploads." },
      { status: 500 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const path = `${projectId}/${Date.now()}-${file.name}`;

  const { error } = await client.storage.from("project-photos").upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = client.storage.from("project-photos").getPublicUrl(path);

  const photo = await addProjectPhoto(projectId, {
    storage_path: path,
    public_url: data.publicUrl,
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
}
