import { NextResponse } from "next/server";

const BASE_ENDPOINT = "https://solar.googleapis.com/v1";

export async function GET(request: Request) {
  const secret = process.env.GOOGLE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "GOOGLE_SECRET_KEY is not configured on the server." }, { status: 500 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id")?.trim();

  if (!id) {
    return NextResponse.json({ error: "Missing required query param: id" }, { status: 400 });
  }

  const endpoint = `${BASE_ENDPOINT}/geoTiff:get?${new URLSearchParams({ id, key: secret }).toString()}`;

  const upstream = await fetch(endpoint, {
    cache: "no-store"
  });

  if (!upstream.ok) {
    const fallback = { error: `GeoTIFF request failed (${upstream.status} ${upstream.statusText}).` };
    const payload = await upstream.json().catch(() => fallback);
    return NextResponse.json(payload, { status: upstream.status });
  }

  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  const arrayBuffer = await upstream.arrayBuffer();

  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store"
    }
  });
}
