import { NextResponse } from "next/server";

const GOOGLE_INDEXING_ENDPOINT = "https://indexing.googleapis.com/v3/urlNotifications:publish";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    url?: string;
    type?: "URL_UPDATED" | "URL_DELETED";
  };

  const token = request.headers.get("x-indexing-token");
  if (!process.env.INDEXING_TOKEN || token !== process.env.INDEXING_TOKEN) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = body.url;
  if (!url) {
    return NextResponse.json({ ok: false, error: "url is required" }, { status: 400 });
  }

  const serviceAccountJson = process.env.GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    return NextResponse.json({ ok: true, skipped: true, reason: "indexing creds not configured" });
  }

  // TODO: Replace this placeholder with OAuth2 JWT token exchange and a signed call.
  // For now this route is an auditable trigger contract and intentionally non-destructive.
  return NextResponse.json({
    ok: true,
    queued: false,
    skipped: true,
    reason: "google indexing call not yet wired",
    endpoint: GOOGLE_INDEXING_ENDPOINT,
    requestedUrl: url,
    requestedType: body.type ?? "URL_UPDATED"
  });
}
