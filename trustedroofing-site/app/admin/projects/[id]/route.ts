import { NextResponse } from "next/server";
import { getProjectById, linkInstantQuotesToProject, listProjectInstantQuotes, updateProject } from "@/lib/db";
import { buildProjectIndexNowUrls, getSiteUrl } from "@/lib/indexnow";

async function triggerIndexing(urls: string[]) {
  if (!process.env.INDEXING_TOKEN) return;

  try {
    await fetch(new URL("/api/index-project", getSiteUrl()), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-indexing-token": process.env.INDEXING_TOKEN
      },
      body: JSON.stringify({ urlList: urls, type: "URL_UPDATED" }),
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
  const instantQuotes = await listProjectInstantQuotes(project.id);

  // Temporary debug logging for project photo display issues.
  console.info("[admin/projects/:id GET] project photo query", {
    projectId: params.id,
    returnedPhotoCount: project.photos?.length ?? 0,
    firstPhotoUrl: project.photos?.[0]?.public_url ?? null
  });

  return NextResponse.json({ project, instant_quotes: instantQuotes });
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
      is_published: body.is_published,
      quoted_material_cost: body.quoted_material_cost ?? null,
      quoted_subcontractor_cost: body.quoted_subcontractor_cost ?? null,
      quoted_labor_cost: body.quoted_labor_cost ?? null,
      quoted_equipment_cost: body.quoted_equipment_cost ?? null,
      quoted_disposal_cost: body.quoted_disposal_cost ?? null,
      quoted_permit_cost: body.quoted_permit_cost ?? null,
      quoted_other_cost: body.quoted_other_cost ?? null,
      quoted_sale_price: body.quoted_sale_price ?? null,
      actual_material_cost: body.actual_material_cost ?? null,
      actual_subcontractor_cost: body.actual_subcontractor_cost ?? null,
      actual_labor_cost: body.actual_labor_cost ?? null,
      actual_equipment_cost: body.actual_equipment_cost ?? null,
      actual_disposal_cost: body.actual_disposal_cost ?? null,
      actual_permit_cost: body.actual_permit_cost ?? null,
      actual_other_cost: body.actual_other_cost ?? null,
      actual_sale_price: body.actual_sale_price ?? null
    });

    const quoteIds = Array.isArray(body.instant_quote_ids)
      ? body.instant_quote_ids.filter((value: unknown): value is string => typeof value === "string" && value.length > 0)
      : [];
    if (quoteIds.length > 0) {
      await linkInstantQuotesToProject(project.id, quoteIds);
    }

    const hydrated = await getProjectById(project.id);

    if (project.is_published) {
      await triggerIndexing(buildProjectIndexNowUrls(project.slug));
    }

    return NextResponse.json({ project: hydrated ?? project });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update project." },
      { status: 400 }
    );
  }
}
