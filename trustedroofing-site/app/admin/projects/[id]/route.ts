import { NextResponse } from "next/server";
import { getProjectById, updateProject, enqueueGbpPost } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const project = await getProjectById(params.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const project = await updateProject(params.id, {
    slug: body.slug,
    title: body.title,
    summary: body.summary,
    description: body.description,
    service_slug: body.service_slug,
    neighborhood: body.neighborhood,
    quadrant: body.quadrant,
    city: body.city,
    province: body.province,
    lat_private: body.lat_private,
    lng_private: body.lng_private,
    completed_at: body.completed_at,
    is_published: body.is_published
  });

  await enqueueGbpPost(project.id, {
    text: project.summary,
    projectSlug: project.slug,
    targetUrl: `https://trustedroofingcalgary.com/projects/${project.slug}`,
    firstImage: project.photos?.[0]?.public_url ?? null
  });

  return NextResponse.json({ project });
}
