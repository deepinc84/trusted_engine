import { NextResponse } from "next/server";
import { deleteProjectPhoto, updateProjectPhoto } from "@/lib/db";

const STAGES = new Set(["before", "tear_off_prep", "installation", "after", "detail_issue"]);

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const stageRaw = body.stage == null ? undefined : String(body.stage).toLowerCase();
    const stage = stageRaw && STAGES.has(stageRaw) ? stageRaw as "before" | "tear_off_prep" | "installation" | "after" | "detail_issue" : undefined;
    const photo = await updateProjectPhoto(params.id, {
      file_name: body.file_name == null ? undefined : String(body.file_name),
      stage,
      caption: body.caption == null ? undefined : String(body.caption),
      description: body.description == null ? undefined : String(body.description)
    });
    return NextResponse.json({ photo });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update photo." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await deleteProjectPhoto(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete photo." },
      { status: 400 }
    );
  }
}
