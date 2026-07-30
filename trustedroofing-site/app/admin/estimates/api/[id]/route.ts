import { NextRequest, NextResponse } from "next/server";
import { getEstimateDraft, saveEstimateDraft, type EstimateDraft } from "@/lib/roofing-estimates/repository";
function adminActor(request: NextRequest) { return request.headers.get("x-admin-user")?.trim() || "admin-token-user"; }
export async function GET(_: NextRequest, { params }: { params: { id: string } }) { const estimate = await getEstimateDraft(params.id); return estimate ? NextResponse.json(estimate) : NextResponse.json({ error: "Estimate not found." }, { status: 404 }); }
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) { try { const body = await request.json() as EstimateDraft; return NextResponse.json(await saveEstimateDraft({ ...body, id: params.id }, adminActor(request))); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save estimate." }, { status: 400 }); } }
