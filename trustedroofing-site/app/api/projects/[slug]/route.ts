import { NextResponse } from "next/server";
import { getProjectBySlug } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const project = await getProjectBySlug(params.slug);
  if (!project || !project.is_published) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({
    project: {
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
      photos: (project.photos ?? []).map((photo) => ({
        id: photo.id,
        public_url: photo.public_url,
        caption: photo.caption,
        sort_order: photo.sort_order,
        is_primary: photo.is_primary,
        lat_public: photo.lat_public,
        lng_public: photo.lng_public,
        blurhash: photo.blurhash
      }))
    }
  });
}
