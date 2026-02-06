import { NextResponse } from "next/server";
import {
  createProject,
  createProjectUploadBatch,
  getProjectBySlug,
  listProjects
} from "@/lib/db";
import { parseNumber } from "@/lib/geo";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (slug) {
    const project = await getProjectBySlug(slug);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json({ project });
  }

  const serviceType = searchParams.get("service_type");
  const limit = parseNumber(searchParams.get("limit"));
  const nearLat = parseNumber(searchParams.get("near_lat"));
  const nearLng = parseNumber(searchParams.get("near_lng"));

  const projects = await listProjects({
    service_type: serviceType,
    limit,
    near_lat: nearLat,
    near_lng: nearLng
  });

  return NextResponse.json({
    projects,
    note: "Carousel cards use the first image only; full project galleries may include multiple images."
  });
}

export async function POST(request: Request) {
  const body = await request.json();

  if (body.mode === "upload_batch") {
    const files = Array.isArray(body.files) ? body.files : [];
    const uploads = await createProjectUploadBatch(files);
    return NextResponse.json({ uploads });
  }

  const required = [
    "slug",
    "title",
    "service_type",
    "neighborhood",
    "city",
    "province",
    "lat",
    "lng",
    "summary",
    "description",
    "completed_at",
    "images"
  ];

  const missing = required.filter((key) => body[key] === undefined);
  if (missing.length) {
    return NextResponse.json(
      { error: `Missing fields: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  const project = await createProject(body);
  return NextResponse.json({ project }, { status: 201 });
}
