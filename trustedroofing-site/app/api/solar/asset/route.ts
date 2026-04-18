import { NextResponse } from "next/server";

function isAllowedHost(url: URL) {
  return url.hostname === "solar.googleapis.com" || url.hostname.endsWith(".googleapis.com");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const assetUrl = searchParams.get("url");

  if (!assetUrl) {
    return NextResponse.json({ error: "Missing `url` query parameter." }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(assetUrl);
  } catch {
    return NextResponse.json({ error: "Invalid asset URL." }, { status: 400 });
  }

  if (!isAllowedHost(parsed)) {
    return NextResponse.json({ error: "Asset URL host is not allowed." }, { status: 400 });
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      cache: "no-store"
    });

    if (!upstream.ok) {
      const payload = await upstream.text().catch(() => "");
      return NextResponse.json(
        {
          error: "Could not load image asset from Solar API.",
          status: upstream.status,
          statusText: upstream.statusText,
          detail: payload.slice(0, 500)
        },
        { status: upstream.status }
      );
    }

    const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
    const contentLength = upstream.headers.get("content-length");

    return new Response(upstream.body, {
      headers: {
        "Content-Type": contentType,
        ...(contentLength ? { "Content-Length": contentLength } : {}),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected asset proxy failure.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
