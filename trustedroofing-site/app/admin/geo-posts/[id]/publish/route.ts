import { NextResponse } from "next/server";
import { publishGeoPostById } from "@/lib/db";
import { buildGeoPostIndexNowUrls, notifyIndexNowUrls } from "@/lib/indexnow";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const geoPost = await publishGeoPostById(params.id);
    if (geoPost.slug) {
      await notifyIndexNowUrls(buildGeoPostIndexNowUrls(geoPost.slug));
    }
    return NextResponse.redirect(new URL("/admin/geo-posts", request.url), { status: 303 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to publish geo-post" },
      { status: 400 }
    );
  }
}
