import { NextResponse } from "next/server";
import { createProject, linkInstantQuotesToProject, listProjects } from "@/lib/db";
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
      is_published: body.is_published ?? true,
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

    if (project.is_published) {
      await triggerIndexing(buildProjectIndexNowUrls(project.slug));
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create project." },
      { status: 400 }
    );
  }
}
