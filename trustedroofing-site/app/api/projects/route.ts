import { NextResponse } from "next/server";
import { parseNumber } from "@/lib/geo";
import { listProjects } from "@/lib/db";

function toPublicProject(project: Awaited<ReturnType<typeof listProjects>>[number]) {
  return {
    id: project.id,
    slug: project.slug,
    title: project.title,
    summary: project.summary,
    description: project.description,
    service_slug: project.service_slug,
    city: project.city,
    province: project.province,
    neighborhood: project.neighborhood,
    quadrant: project.quadrant,
    lat_public: project.lat_public,
    lng_public: project.lng_public,
    completed_at: project.completed_at,
    created_at: project.created_at,
    is_published: project.is_published,
    photos: (project.photos ?? []).map((photo) => ({
      id: photo.id,
      public_url: photo.public_url,
      caption: photo.caption,
      sort_order: photo.sort_order
    }))
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const projects = await listProjects({
    service_slug: searchParams.get("service_slug"),
    neighborhood: searchParams.get("neighborhood"),
    limit: parseNumber(searchParams.get("limit")),
    near_lat: parseNumber(searchParams.get("near_lat")),
    near_lng: parseNumber(searchParams.get("near_lng")),
    include_unpublished: false
  });

  return NextResponse.json({
    projects: projects.filter((project) => project.is_published).map(toPublicProject)
  });
}
