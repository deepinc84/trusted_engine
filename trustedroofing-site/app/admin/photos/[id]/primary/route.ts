import { NextResponse } from "next/server";
import { setPrimaryProjectPhoto } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const projectId = String(body.project_id ?? "");

  if (!projectId) {
    return NextResponse.json({ error: "project_id is required" }, { status: 400 });
  }

  await setPrimaryProjectPhoto(projectId, params.id);
  return NextResponse.json({ ok: true });
}
