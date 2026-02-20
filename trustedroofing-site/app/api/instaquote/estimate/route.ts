import { NextResponse } from "next/server";
import { buildEstimateRanges, complexityBandFromSegments, regionalRoofEstimate } from "@/lib/quote";
import { createInstaquoteAddressQuery } from "@/lib/db";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";

type EstimateBody = {
  address?: string;
  placeId?: string;
  lat?: number | null;
  lng?: number | null;
};

async function geocodeAddress(address: string) {
  const key = process.env.GOOGLE_SECRET_KEY;
  if (!key) return null;

  const params = new URLSearchParams({ address, key, region: "ca" });
  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`, {
    cache: "no-store"
  });
  if (!response.ok) return null;

  const payload = (await response.json()) as {
    status?: string;
    results?: Array<{ formatted_address?: string; geometry?: { location?: { lat?: number; lng?: number } } }>;
  };

  const top = payload.results?.[0];
  if (payload.status !== "OK" || !top?.formatted_address) return null;

  return {
    address: top.formatted_address,
    lat: top.geometry?.location?.lat ?? null,
    lng: top.geometry?.location?.lng ?? null
  };
}

async function solarEstimate(lat: number, lng: number) {
  const key = process.env.GOOGLE_SOLAR_API_KEY;
  if (!key) return null;

  const call = async (quality: "HIGH" | "MEDIUM") => {
    const params = new URLSearchParams({ key, "location.latitude": String(lat), "location.longitude": String(lng), requiredQuality: quality });
    const response = await fetch(`https://solar.googleapis.com/v1/buildingInsights:findClosest?${params.toString()}`, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as {
      solarPotential?: {
        wholeRoofStats?: { areaMeters2?: number; pitchDegrees?: number };
        roofSegmentStats?: Array<{ pitchDegrees?: number }>;
      };
    };
  };

  const high = await call("HIGH");
  const data = high ?? (await call("MEDIUM"));
  const roof = data?.solarPotential?.wholeRoofStats;
  const segments = data?.solarPotential?.roofSegmentStats ?? [];

  if (!roof?.areaMeters2) return null;

  const areaSqft = Math.round(roof.areaMeters2 * 10.7639);
  const avgPitch =
    segments.length > 0
      ? segments.reduce((sum, seg) => sum + (seg.pitchDegrees ?? 25), 0) / segments.length
      : (roof.pitchDegrees ?? 25);

  return {
    roofAreaSqft: areaSqft,
    pitchDegrees: Math.round(avgPitch * 10) / 10,
    complexityBand: complexityBandFromSegments(segments.length || 4),
    dataSource: "google_solar",
    areaSource: "solar" as const
  };
}

export async function POST(request: Request) {
  const ip = requestIp(request);
  const limit = checkRateLimit(`instaquote-estimate:${ip}`, 20, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = (await request.json().catch(() => ({}))) as EstimateBody;
  if (!body.address && (body.lat === null || body.lat === undefined || body.lng === null || body.lng === undefined)) {
    return NextResponse.json({ error: "address or lat/lng is required" }, { status: 400 });
  }

  let normalizedAddress = body.address?.trim() ?? "";
  let lat = body.lat ?? null;
  let lng = body.lng ?? null;

  if ((lat === null || lng === null) && normalizedAddress) {
    const geocoded = await geocodeAddress(normalizedAddress);
    if (geocoded) {
      normalizedAddress = geocoded.address;
      lat = geocoded.lat;
      lng = geocoded.lng;
    }
  }

  let estimateResult:
    | {
        roofAreaSqft: number;
        pitchDegrees: number;
        complexityBand: "simple" | "moderate" | "complex";
        dataSource: string;
        areaSource: "solar" | "regional";
      }
    | null = null;

  if (lat !== null && lng !== null) {
    estimateResult = await solarEstimate(lat, lng);
  }

  if (!estimateResult) {
    const regional = regionalRoofEstimate({ address: normalizedAddress, lat, lng });
    estimateResult = {
      roofAreaSqft: regional.roofAreaSqft,
      pitchDegrees: 25,
      complexityBand: "moderate",
      dataSource: "regional_fallback",
      areaSource: "regional"
    };
  }

  const ranges = buildEstimateRanges({
    roofAreaSqft: estimateResult.roofAreaSqft,
    pitchDegrees: estimateResult.pitchDegrees,
    complexityBand: estimateResult.complexityBand
  });

  const addressQueryId = await createInstaquoteAddressQuery({
    address: normalizedAddress || "Calgary, AB",
    place_id: body.placeId ?? null,
    lat,
    lng,
    roof_area_sqft: ranges.roofAreaSqft,
    pitch_degrees: ranges.pitchDegrees,
    complexity_band: ranges.complexityBand,
    area_source: estimateResult.areaSource,
    data_source: estimateResult.dataSource
  });

  return NextResponse.json({
    ok: true,
    roofAreaSqft: ranges.roofAreaSqft,
    roofSquares: ranges.roofSquares,
    pitchDegrees: ranges.pitchDegrees,
    dataSource: estimateResult.dataSource,
    areaSource: estimateResult.areaSource,
    complexityBand: ranges.complexityBand,
    complexityScore: ranges.complexityScore,
    regionalRanges:
      estimateResult.areaSource === "regional"
        ? regionalRoofEstimate({ address: normalizedAddress, lat, lng }).regionalRanges
        : null,
    ranges,
    addressQueryId,
    address: normalizedAddress || "Calgary, AB"
  });
}
