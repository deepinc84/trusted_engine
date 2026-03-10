import { NextResponse } from "next/server";
import { createProject, listProjects, syncGeoPostForProject } from "@/lib/db";

async function triggerIndexing(url: string) {
  if (!process.env.INDEXING_TOKEN) return;

  try {
    await fetch(new URL("/api/index-project", process.env.NEXT_PUBLIC_SITE_URL ?? "https://trustedroofingcalgary.com"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-indexing-token": process.env.INDEXING_TOKEN
      },
      body: JSON.stringify({ url, type: "URL_UPDATED" }),
      cache: "no-store"
    });
  } catch {
    // best effort only; publishing should not fail if indexing ping fails
  }
}

export async function GET() {
  const projects = await listProjects({ include_unpublished: true, limit: 100 });
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const project = await createProject({
      slug: body.slug,
      title: body.title,
      summary: body.summary,
      description: body.description ?? null,
      service_slug: body.service_slug,
      neighborhood: body.neighborhood ?? null,
      quadrant: body.quadrant ?? null,
      address_private: body.address_private ?? null,
      place_id: body.place_id ?? null,
      geocode_source: body.geocode_source ?? null,
      city: body.city ?? "Calgary",
      province: body.province ?? "AB",
      lat_private: body.lat_private ?? null,
      lng_private: body.lng_private ?? null,
      completed_at: body.completed_at ?? null,
      is_published: body.is_published ?? true
    });

    const geoPost = await syncGeoPostForProject(project.id);

    const targetUrl = `https://trustedroofingcalgary.com/projects/${project.slug}`;
    await triggerIndexing(targetUrl);

    return NextResponse.json({ project, geo_post: geoPost }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create project and linked geo post." },
      { status: 400 }
    );
  }
}
