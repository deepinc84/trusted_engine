import { NextRequest, NextResponse } from "next/server";
import { saveEstimateDraft, type EstimateDraft } from "@/lib/roofing-estimates/repository";
function adminActor(request: NextRequest) { return request.headers.get("x-admin-user")?.trim() || "admin-token-user"; }
export async function POST(request: NextRequest) {
  try { return NextResponse.json(await saveEstimateDraft(await request.json() as EstimateDraft, adminActor(request)), { status: 201 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save estimate." }, { status: 400 }); }
}
