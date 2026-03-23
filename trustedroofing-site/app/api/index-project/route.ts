import { NextResponse } from "next/server";
import { submitIndexNowUrls } from "@/lib/indexnow";

const GOOGLE_INDEXING_ENDPOINT = "https://indexing.googleapis.com/v3/urlNotifications:publish";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    url?: string;
    urlList?: string[];
    type?: "URL_UPDATED" | "URL_DELETED";
  };

  const token = request.headers.get("x-indexing-token");
  if (!process.env.INDEXING_TOKEN || token !== process.env.INDEXING_TOKEN) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const urlList = Array.isArray(body.urlList)
    ? body.urlList.filter((url): url is string => typeof url === "string" && url.length > 0)
    : [];
  const requestedUrls = body.url ? [body.url, ...urlList] : urlList;

  if (requestedUrls.length === 0) {
    return NextResponse.json({ ok: false, error: "url or urlList is required" }, { status: 400 });
  }

  let indexNow;
  try {
    indexNow = await submitIndexNowUrls(requestedUrls);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "IndexNow submission failed",
        requestedType: body.type ?? "URL_UPDATED"
      },
      { status: 502 }
    );
  }

  const serviceAccountJson = process.env.GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    return NextResponse.json({
      ok: indexNow.ok,
      indexNow,
      google: {
        ok: true,
        queued: false,
        skipped: true,
        reason: "google indexing creds not configured",
        endpoint: GOOGLE_INDEXING_ENDPOINT
      },
      requestedType: body.type ?? "URL_UPDATED"
    }, { status: indexNow.ok ? 200 : 502 });
  }

  // TODO: Replace this placeholder with OAuth2 JWT token exchange and a signed call.
  // For now Google indexing remains an auditable trigger contract while IndexNow submits live.
  return NextResponse.json({
    ok: indexNow.ok,
    indexNow,
    google: {
      ok: true,
      queued: false,
      skipped: true,
      reason: "google indexing call not yet wired",
      endpoint: GOOGLE_INDEXING_ENDPOINT
    },
    requestedUrls,
    requestedType: body.type ?? "URL_UPDATED"
  }, { status: indexNow.ok ? 200 : 502 });
}
