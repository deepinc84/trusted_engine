import { NextResponse } from "next/server";
import { getProjectById, syncGeoPostForProject } from "@/lib/db";
import { buildGeoPostIndexNowUrls, getSiteUrl } from "@/lib/indexnow";

async function triggerIndexing(urls: string[]) {
  if (!process.env.INDEXING_TOKEN) return;

  try {
    await fetch(new URL("/api/index-project", getSiteUrl()), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-indexing-token": process.env.INDEXING_TOKEN
      },
      body: JSON.stringify({ urlList: urls, type: "URL_UPDATED" }),
      cache: "no-store"
    });
  } catch {
    // best effort only; geo-post publishing should not fail if indexing ping fails
  }
}

function expectsHtmlNavigation(request: Request) {
  const accept = request.headers.get("accept") ?? "";
  const secFetchMode = request.headers.get("sec-fetch-mode") ?? "";
  return accept.includes("text/html") || secFetchMode === "navigate";
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const wantsHtml = expectsHtmlNavigation(request);
  try {
    const project = await getProjectById(params.id);
    if (!project) {
      if (wantsHtml) {
        return NextResponse.redirect(new URL("/admin/geo-posts?error=project-not-found", request.url), { status: 303 });
      }
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    if (!project.photos || project.photos.length === 0) {
      if (wantsHtml) {
        return NextResponse.redirect(new URL(`/admin/projects/${project.id}/edit?error=geo-post-needs-photo`, request.url), { status: 303 });
      }
      return NextResponse.json(
        { error: "Upload at least one project photo before publishing a geo-post." },
        { status: 400 }
      );
    }

    const geoPost = await syncGeoPostForProject(project.id);
    if (geoPost.slug) {
      await triggerIndexing(buildGeoPostIndexNowUrls(geoPost.slug));
    }

    if (wantsHtml) {
      return NextResponse.redirect(new URL(`/admin/geo-posts?projectId=${project.id}`, request.url), { status: 303 });
    }

    return NextResponse.json({ geo_post: geoPost });
  } catch (error) {
    if (wantsHtml) {
      return NextResponse.redirect(new URL(`/admin/projects/${params.id}/edit?error=geo-post-publish-failed`, request.url), { status: 303 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to publish geo-post." },
      { status: 400 }
    );
  }
}
