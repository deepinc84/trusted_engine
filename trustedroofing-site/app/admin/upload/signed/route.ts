import { NextResponse } from "next/server";
import { getProjectById, getStorageAdminClient } from "@/lib/db";
import { buildProjectPhotoPath, getProjectPhotosBucketName } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const projectId = String(body.project_id ?? "");
    const fileName = String(body.file_name ?? "project-photo");
    const stageInput = String(body.stage ?? body.phase ?? "before").toLowerCase();
    const phase = stageInput === "after" ? "after" : "before";

    if (!projectId) {
      return NextResponse.json({ error: "project_id is required." }, { status: 400 });
    }

    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const client = getStorageAdminClient();
    if (!client) {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY is required for upload signing." },
        { status: 500 }
      );
    }

    const bucket = getProjectPhotosBucketName();
    const path = buildProjectPhotoPath(projectId, fileName, phase);

    const { data: signed, error } = await client.storage.from(bucket).createSignedUploadUrl(path);
    if (error) {
      if (error.message.toLowerCase().includes("bucket not found")) {
        return NextResponse.json(
          { error: `Storage bucket \"${bucket}\" was not found. Create it in Supabase Storage or set PROJECT_PHOTOS_BUCKET.` },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { data: publicData } = client.storage.from(bucket).getPublicUrl(path);

    return NextResponse.json({
      provider: "supabase",
      bucket,
      path,
      token: signed.token,
      public_url: publicData.publicUrl
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to initialize upload." },
      { status: 400 }
    );
  }
}
