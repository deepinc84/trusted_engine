import { NextResponse } from "next/server";
import { updateGeoPostAdmin } from "@/lib/db";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const form = await request.formData();
  const status = String(form.get("status") ?? "draft") as "draft" | "queued" | "published" | "failed";
  const content = String(form.get("content") ?? "");

  try {
    await updateGeoPostAdmin(params.id, { status, content: content || null });
    return NextResponse.redirect(new URL(`/admin/geo-posts/${params.id}`, request.url), { status: 303 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update geo-post" }, { status: 400 });
  }
}
