import { NextResponse } from "next/server";
import { listRecentInstaquoteAddressQueries } from "@/lib/db";
import { haversineKm } from "@/lib/geo";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const ip = requestIp(request);
  const limit = checkRateLimit(`instaquote-nearby:${ip}`, 60, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radiusKm = Number(searchParams.get("radiusKm") ?? 25);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180 || radiusKm <= 0 || radiusKm > 100) {
    return NextResponse.json({ error: "invalid bounds" }, { status: 400 });
  }

  const rows = await listRecentInstaquoteAddressQueries(500);
  const items = rows
    .filter((row) => row.lat !== null && row.lng !== null)
    .map((row) => ({ row, distance: haversineKm(lat, lng, Number(row.lat), Number(row.lng)) }))
    .filter((entry) => entry.distance <= radiusKm)
    .slice(0, 50)
    .map(({ row }) => ({
      lat: row.lat,
      lng: row.lng,
      address: row.address,
      roof_area_sqft: row.roof_area_sqft,
      complexity_band: row.complexity_band,
      queried_at: row.queried_at
    }));

  return NextResponse.json({ ok: true, items });
}
