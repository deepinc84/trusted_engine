import { NextResponse } from "next/server";
import { listRecentInstaquoteAddressQueries } from "@/lib/db";
import { haversineKm } from "@/lib/geo";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";

type Row = {
  lat: number;
  lng: number;
  address: string;
  roof_area_sqft: number | null;
  pitch_degrees: number | null;
  complexity_band: string | null;
  estimate_low: number | null;
  estimate_high: number | null;
  queried_at: string;
};

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function extractQuadrant(address: string) {
  const match = address.toUpperCase().match(/\b(NE|NW|SE|SW)\b/);
  return match?.[1] ?? null;
}

function extractCity(address: string) {
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  const cityPart = parts.find((part) => /calgary|airdrie|okotoks|cochrane|chestermere/i.test(part));
  return cityPart ?? (parts[1] ?? null);
}

function extractNeighborhood(address: string) {
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  const first = parts[0] ?? "";
  const stripped = first
    .replace(/^\d+[A-Za-z-]*\s+/, "")
    .replace(/\b(AVENUE|AVE|STREET|ST|ROAD|RD|DRIVE|DR|BOULEVARD|BLVD|COURT|CT|WAY|TRAIL|TR)\b/gi, "")
    .replace(/\b(NE|NW|SE|SW)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return stripped.length >= 3 ? stripped : null;
}

function rankRows(rows: Row[], targetAddress: string | null) {
  const targetNeighborhood = normalize(extractNeighborhood(targetAddress ?? ""));
  const targetQuadrant = normalize(extractQuadrant(targetAddress ?? ""));
  const targetCity = normalize(extractCity(targetAddress ?? ""));

  const enriched = rows.map((row, index) => {
    const neighborhood = normalize(extractNeighborhood(row.address));
    const quadrant = normalize(extractQuadrant(row.address));
    const city = normalize(extractCity(row.address));

    return {
      row,
      index,
      neighborhood,
      quadrant,
      city,
      neighborhoodMatch: !!targetNeighborhood && neighborhood.includes(targetNeighborhood),
      quadrantMatch: !!targetQuadrant && quadrant === targetQuadrant,
      cityMatch: !!targetCity && city === targetCity
    };
  });

  const neighborhoodMatches = enriched.filter((entry) => entry.neighborhoodMatch);
  const quadrantMatches = enriched.filter((entry) => !entry.neighborhoodMatch && entry.quadrantMatch);
  const cityMatches = enriched.filter((entry) => !entry.neighborhoodMatch && !entry.quadrantMatch && entry.cityMatch);
  const rest = enriched.filter((entry) => !entry.neighborhoodMatch && !entry.quadrantMatch && !entry.cityMatch);

  const ordered = [...neighborhoodMatches, ...quadrantMatches, ...cityMatches, ...rest];
  return ordered.map((entry) => entry.row);
}

export async function GET(request: Request) {
  const ip = requestIp(request);
  const limit = checkRateLimit(`instaquote-nearby:${ip}`, 60, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const rawLat = searchParams.get("lat");
  const rawLng = searchParams.get("lng");
  const lat = rawLat === null ? NaN : Number(rawLat);
  const lng = rawLng === null ? NaN : Number(rawLng);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const radiusKm = Number(searchParams.get("radiusKm") ?? 25);
  const address = searchParams.get("address");

  if (hasCoords && (lat < -90 || lat > 90 || lng < -180 || lng > 180 || radiusKm <= 0 || radiusKm > 100)) {
    return NextResponse.json({ error: "invalid bounds" }, { status: 400 });
  }

  const rows = await listRecentInstaquoteAddressQueries(500);
  const recentRows: Row[] = rows
    .filter((row): row is typeof row & { lat: number; lng: number } => row.lat !== null && row.lng !== null)
    .map((row) => ({
      lat: Number(row.lat),
      lng: Number(row.lng),
      address: row.address,
      roof_area_sqft: row.roof_area_sqft,
      pitch_degrees: row.pitch_degrees,
      complexity_band: row.complexity_band,
      estimate_low: row.estimate_low,
      estimate_high: row.estimate_high,
      queried_at: row.queried_at
    }));

  const withinRadius = hasCoords
    ? recentRows
      .map((row) => ({ row, distance: haversineKm(lat, lng, row.lat, row.lng) }))
      .filter((entry) => entry.distance <= radiusKm)
      .map((entry) => entry.row)
    : [];

  const rankedPrimary = rankRows(withinRadius, address);
  const rankedFallback = rankRows(recentRows, address);
  const source = rankedPrimary.length > 0 ? rankedPrimary : rankedFallback;

  const items = source.slice(0, 50).map((row) => ({
    lat: row.lat,
    lng: row.lng,
    address: row.address,
    neighborhood: extractNeighborhood(row.address),
    quadrant: extractQuadrant(row.address),
    city: extractCity(row.address),
    roof_area_sqft: row.roof_area_sqft,
    pitch_degrees: row.pitch_degrees,
    complexity_band: row.complexity_band,
    estimate_low: row.estimate_low,
    estimate_high: row.estimate_high,
    queried_at: row.queried_at
  }));

  return NextResponse.json({ ok: true, items });
}
