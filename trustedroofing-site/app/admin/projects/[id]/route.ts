import { NextResponse } from "next/server";
import { getProjectById, updateProject } from "@/lib/db";

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

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const project = await getProjectById(params.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Temporary debug logging for project photo display issues.
  console.info("[admin/projects/:id GET] project photo query", {
    projectId: params.id,
    returnedPhotoCount: project.photos?.length ?? 0,
    firstPhotoUrl: project.photos?.[0]?.public_url ?? null
  });

  return NextResponse.json({ project });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const project = await updateProject(params.id, {
      slug: body.slug,
      title: body.title,
      summary: body.summary,
      description: body.description,
      service_slug: body.service_slug,
      neighborhood: body.neighborhood,
      quadrant: body.quadrant,
      address_private: body.address_private,
      place_id: body.place_id,
      geocode_source: body.geocode_source,
      city: body.city,
      province: body.province,
      lat_private: body.lat_private,
      lng_private: body.lng_private,
      completed_at: body.completed_at,
      is_published: body.is_published
    });

    const hydrated = await getProjectById(project.id);

    const targetUrl = `https://trustedroofingcalgary.com/projects/${project.slug}`;
    await triggerIndexing(targetUrl);

    return NextResponse.json({ project: hydrated ?? project });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update project." },
      { status: 400 }
    );
  }
}
