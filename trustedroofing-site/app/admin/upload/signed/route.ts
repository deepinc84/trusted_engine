import { NextResponse } from "next/server";
import { getProjectById, getStorageAdminClient } from "@/lib/db";
import { buildProjectPhotoPath, getProjectPhotosBucketName } from "@/lib/storage";

function slugPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function locationFromAddress(address: string | null) {
  const firstPart = (address ?? "").split(",")[0]?.trim() ?? "";
  return firstPart
    .replace(/^\d+[a-zA-Z]?(?:-\d+[a-zA-Z]?)?\s+/, "")
    .trim();
}

function extensionFromFileName(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "jpg";
  return extension.replace(/[^a-z0-9]/g, "") || "jpg";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const projectId = String(body.project_id ?? "");
    const fileName = String(body.file_name ?? "project-photo");
    const stageInput = String(body.stage ?? body.phase ?? "before").toLowerCase();
    const stage = stageInput === "after"
      ? "after"
      : stageInput === "tear_off_prep"
        ? "tear_off_prep"
        : stageInput === "installation"
          ? "installation"
          : stageInput === "detail_issue"
            ? "detail_issue"
            : "before";
    const sequence = Math.max(1, Number(body.sequence ?? 1));

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
    const service = slugPart(String(body.service_slug ?? project.service_slug ?? "roofing")) || "roofing";
    const streetLevel = slugPart(locationFromAddress(String(body.street_level ?? project.address_private ?? "")));
    const near = streetLevel ? `near-${streetLevel}` : `near-${slugPart(project.neighborhood ?? project.city ?? "calgary")}`;
    const datePart = String(body.completed_at ?? project.completed_at ?? new Date().toISOString().slice(0, 10));
    const ext = extensionFromFileName(fileName);
    const seoFileName = `${stage.replace(/_/g, "-")}-${service}-${near}-${datePart}-${String(sequence).padStart(2, "0")}.${ext}`;
    const path = buildProjectPhotoPath(projectId, seoFileName, stage);

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
      file_name: seoFileName,
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
