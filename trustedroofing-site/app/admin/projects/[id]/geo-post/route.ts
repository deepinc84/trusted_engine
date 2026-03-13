import { NextResponse } from "next/server";
import { getProjectById, syncGeoPostForProject } from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const project = await getProjectById(params.id);
    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    if (!project.photos || project.photos.length === 0) {
      return NextResponse.json(
        { error: "Upload at least one project photo before publishing a geo-post." },
        { status: 400 }
      );
    }

    const geoPost = await syncGeoPostForProject(project.id);
    return NextResponse.json({ geo_post: geoPost });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to publish geo-post." },
      { status: 400 }
    );
  }
}
