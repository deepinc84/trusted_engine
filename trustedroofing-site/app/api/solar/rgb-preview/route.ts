import { NextResponse } from "next/server";

type CacheEntry = {
  contentType: string;
  body: Buffer;
  expiresAt: number;
};

const CACHE_TTL_MS = 1000 * 60 * 60;
const memoryCache = new Map<string, CacheEntry>();

function parseAssetId(rgbUrl: string) {
  try {
    const parsed = new URL(rgbUrl);
    return parsed.searchParams.get("id") ?? "";
  } catch {
    return "";
  }
}

function getCacheKey(assetId: string) {
  return `rgb-preview:${assetId}`;
}

async function fetchRgbAsset(assetId: string, key: string) {
  const params = new URLSearchParams({ id: assetId, key });
  const url = `https://solar.googleapis.com/v1/geoTiff:get?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      Accept: "image/png,image/*;q=0.9,*/*;q=0.8"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Solar geoTiff:get failed (${response.status} ${response.statusText}): ${detail.slice(0, 300)}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") ?? "application/octet-stream";

  return { bytes, contentType };
}

export async function GET(request: Request) {
  const secret = process.env.GOOGLE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "GOOGLE_SECRET_KEY is not configured." }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const assetIdInput = searchParams.get("assetId")?.trim() ?? "";
  const rgbUrlInput = searchParams.get("rgbUrl")?.trim() ?? "";
  const assetId = assetIdInput || (rgbUrlInput ? parseAssetId(rgbUrlInput) : "");

  if (!assetId) {
    return NextResponse.json(
      { error: "Missing `assetId` (or `rgbUrl` containing an id query param)." },
      { status: 400 }
    );
  }

  const key = getCacheKey(assetId);
  const now = Date.now();
  const cached = memoryCache.get(key);
  if (cached && cached.expiresAt > now) {
    return new Response(cached.body, {
      headers: {
        "Content-Type": cached.contentType,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "X-Solar-Preview-Cache": "HIT"
      }
    });
  }

  try {
    const asset = await fetchRgbAsset(assetId, secret);

    // NOTE: Solar commonly serves GeoTIFF; if runtime conversion support is added later,
    // this route is the single place to convert TIFF -> PNG.
    memoryCache.set(key, {
      contentType: asset.contentType,
      body: asset.bytes,
      expiresAt: now + CACHE_TTL_MS
    });

    return new Response(asset.bytes, {
      headers: {
        "Content-Type": asset.contentType,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "X-Solar-Preview-Cache": "MISS"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch RGB preview.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
