import { NextResponse } from "next/server";
import { updateGeoPostAdmin } from "@/lib/db";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const form = await request.formData();
  const status = String(form.get("status") ?? "draft") as "draft" | "queued" | "published" | "failed";
  const content = String(form.get("content") ?? "");
  const serviceSlugRaw = String(form.get("service_slug") ?? "").trim();
  const selectedImageRaw = String(form.get("primary_image_url") ?? "").trim();
  const projectLinkAnchorText = String(form.get("project_link_anchor_text") ?? "").trim();
  const projectLinkHref = String(form.get("project_link_href") ?? "").trim();

  let finalContent = content.trim();
  if (projectLinkHref) {
    const anchorText = projectLinkAnchorText || "View related project";
    const markdownLink = `[${anchorText}](${projectLinkHref})`;
    if (!finalContent.includes(markdownLink)) {
      finalContent = finalContent ? `${finalContent}\n\n${markdownLink}` : markdownLink;
    }
  }

  try {
    await updateGeoPostAdmin(params.id, {
      status,
      content: finalContent || null,
      service_slug: serviceSlugRaw || null,
      primary_image_url: selectedImageRaw || null
    });
    return NextResponse.redirect(new URL(`/admin/geo-posts/${params.id}`, request.url), { status: 303 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update geo-post" }, { status: 400 });
  }
}
