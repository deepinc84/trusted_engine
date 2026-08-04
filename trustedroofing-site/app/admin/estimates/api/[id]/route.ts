import { NextRequest, NextResponse } from "next/server";
import { correlationId } from "@/lib/readiness/logging";
import { recordOperationalError } from "@/lib/readiness/operations";
import { getEstimateDraft, saveEstimateDraft, type EstimateDraft } from "@/lib/roofing-estimates/repository";
function adminActor(request: NextRequest) { return request.headers.get("x-admin-user")?.trim() || "admin-token-user"; }
export async function GET(_: NextRequest, { params }: { params: { id: string } }) { const estimate = await getEstimateDraft(params.id); return estimate ? NextResponse.json(estimate) : NextResponse.json({ error: "Estimate not found." }, { status: 404 }); }
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) { const id=correlationId(request.headers.get("x-correlation-id"));try { const body = await request.json() as EstimateDraft; return NextResponse.json({...await saveEstimateDraft({ ...body, id: params.id }, adminActor(request)),correlationId:id}); } catch (error) { await recordOperationalError({severity:"warning",feature:"estimates",operation:"save",safeMessage:"Estimate save failed.",recoverable:true,correlationId:id,route:"/admin/estimates/api/[id]",recordType:"estimate",recordId:params.id,error});return NextResponse.json({ error: `Unable to save estimate. Reference ${id}.` }, { status: 400 }); } }
