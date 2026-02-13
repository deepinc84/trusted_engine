import { NextResponse } from "next/server";
import { addProjectPhoto, getStorageAdminClient, getDataMode } from "@/lib/db";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  const projectId = String(form.get("project_id") ?? "");
  const caption = String(form.get("caption") ?? "");
  const sortOrder = Number(form.get("sort_order") ?? 0);

  if (!(file instanceof File) || !projectId) {
    return NextResponse.json({ error: "file and project_id are required" }, { status: 400 });
  }

  if (getDataMode() === "mock") {
    const mockUrl = `/uploads/${Date.now()}-${file.name}`;
    const photo = await addProjectPhoto(projectId, {
      storage_path: mockUrl,
      public_url: mockUrl,
      caption,
      sort_order: sortOrder
    });
    return NextResponse.json({ photo, mode: "mock" });
  }

  const client = getStorageAdminClient();
  if (!client) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is required for uploads." },
      { status: 500 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const path = `${projectId}/${Date.now()}-${file.name}`;

  const { error } = await client.storage.from("project-photos").upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = client.storage.from("project-photos").getPublicUrl(path);

  const photo = await addProjectPhoto(projectId, {
    storage_path: path,
    public_url: data.publicUrl,
    caption,
    sort_order: sortOrder
  });

  return NextResponse.json({ photo });
}
