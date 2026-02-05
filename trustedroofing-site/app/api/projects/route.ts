import { NextResponse } from "next/server";
import { getProjectBySlug, listProjects } from "@/lib/db";
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

  return NextResponse.json({ projects });
}
