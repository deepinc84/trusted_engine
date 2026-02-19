import { NextResponse } from "next/server";
import { createProject, listProjects, enqueueGbpPost } from "@/lib/db";

export async function GET() {
  const projects = await listProjects({ include_unpublished: true, limit: 100 });
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const body = await request.json();

  const project = await createProject({
    slug: body.slug,
    title: body.title,
    summary: body.summary,
    description: body.description ?? null,
    service_slug: body.service_slug,
    neighborhood: body.neighborhood ?? null,
    quadrant: body.quadrant ?? null,
    city: body.city ?? "Calgary",
    province: body.province ?? "AB",
    lat_private: body.lat_private ?? null,
    lng_private: body.lng_private ?? null,
    completed_at: body.completed_at ?? null,
    is_published: body.is_published ?? true
  });

  await enqueueGbpPost(project.id, {
    text: project.summary,
    projectSlug: project.slug,
    targetUrl: `https://trustedroofingcalgary.com/projects/${project.slug}`,
    firstImage: null
  });

  return NextResponse.json({ project }, { status: 201 });
}
