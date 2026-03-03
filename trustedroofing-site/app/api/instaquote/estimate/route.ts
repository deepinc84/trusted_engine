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

type SolarEstimateResult = {
  result:
    | {
        roofAreaSqft: number;
        pitchDegrees: number;
        complexityBand: "simple" | "moderate" | "complex";
        dataSource: string;
        areaSource: "solar";
      }
    | null;
  debugReason: string | null;
};

async function geocodeAddress(address: string) {
  const key = process.env.GOOGLE_SECRET_KEY;
  if (!key) return null;

  const params = new URLSearchParams({
    address,
    key,
    region: "ca",
    components: "country:CA"
  });

  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`, {
    cache: "no-store"
  });
  if (!response.ok) return null;

  const payload = (await response.json()) as {
    status?: string;
    results?: Array<{ formatted_address?: string; place_id?: string; geometry?: { location?: { lat?: number; lng?: number } } }>;
  };

  const top = payload.results?.[0];
  if (payload.status !== "OK" || !top?.formatted_address) return null;

  return {
    address: top.formatted_address,
    placeId: top.place_id ?? null,
    lat: top.geometry?.location?.lat ?? null,
    lng: top.geometry?.location?.lng ?? null
  };
}

async function geocodeAddressNominatim(address: string) {
  const params = new URLSearchParams({
    q: `${address}, Calgary, AB, Canada`,
    format: "json",
    limit: "1",
    addressdetails: "1"
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: {
      "User-Agent": "TrustedRoofing/1.0",
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as Array<{
    lat?: string;
    lon?: string;
    display_name?: string;
  }>;

  const top = payload[0];
  if (!top?.lat || !top?.lon) return null;

  const lat = Number(top.lat);
  const lng = Number(top.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    address: top.display_name ?? address,
    placeId: null,
    lat,
    lng
  };
}

function degreesToPitchRatio(pitchDegrees: number) {
  const rise = Math.tan((pitchDegrees * Math.PI) / 180) * 12;
  const rounded = Math.max(1, Math.min(13, Math.round(rise)));
  return `${rounded}/12`;
}

async function solarEstimate(lat: number, lng: number): Promise<SolarEstimateResult> {
  const key = process.env.GOOGLE_SECRET_KEY;
  if (!key) {
    return { result: null, debugReason: "missing GOOGLE_SECRET_KEY" };
  }

  const call = async (quality: "HIGH" | "MEDIUM") => {
    const params = new URLSearchParams({
      key,
      "location.latitude": String(lat),
      "location.longitude": String(lng),
      requiredQuality: quality
    });

    const response = await fetch(`https://solar.googleapis.com/v1/buildingInsights:findClosest?${params.toString()}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return {
        data: null,
        error: `quality=${quality} http=${response.status}${text ? ` body=${text.slice(0, 180)}` : ""}`
      };
    }

    const data = (await response.json()) as {
      solarPotential?: {
        wholeRoofStats?: { areaMeters2?: number; pitchDegrees?: number };
        roofSegmentStats?: Array<{ pitchDegrees?: number }>;
      };
      imageryQuality?: string;
      name?: string;
    };

    return { data, error: null as string | null };
  };

  const high = await call("HIGH");
  const medium = high.data ? null : await call("MEDIUM");
  const data = high.data ?? medium?.data ?? null;

  const roof = data?.solarPotential?.wholeRoofStats;
  const segments = data?.solarPotential?.roofSegmentStats ?? [];

  if (!roof?.areaMeters2) {
    const reason = [high.error, medium?.error ?? null].filter(Boolean).join(" | ") || "solar response missing wholeRoofStats.areaMeters2";
    return { result: null, debugReason: reason };
  }

  const areaSqft = Math.round(roof.areaMeters2 * 10.7639);
  const avgPitch =
    segments.length > 0
      ? segments.reduce((sum, seg) => sum + (seg.pitchDegrees ?? 25), 0) / segments.length
      : (roof.pitchDegrees ?? 25);

  return {
    result: {
      roofAreaSqft: areaSqft,
      pitchDegrees: Math.round(avgPitch * 10) / 10,
      complexityBand: complexityBandFromSegments(segments.length || 4),
      dataSource: "google_solar",
      areaSource: "solar"
    },
    debugReason: null
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
  let placeId = body.placeId ?? null;
  let lat = body.lat ?? null;
  let lng = body.lng ?? null;

  if ((lat === null || lng === null) && normalizedAddress) {
    const geocoded = (await geocodeAddress(normalizedAddress)) ?? (await geocodeAddressNominatim(normalizedAddress));
    if (geocoded) {
      normalizedAddress = geocoded.address;
      placeId = geocoded.placeId;
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

  let solarDebug: string | null = null;

  if (lat !== null && lng !== null) {
    const solar = await solarEstimate(lat, lng);
    estimateResult = solar.result;
    solarDebug = solar.debugReason;
  } else {
    solarDebug = "no lat/lng available for solar lookup";
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

  let addressQueryId = crypto.randomUUID();
  try {
    addressQueryId = await createInstaquoteAddressQuery({
      address: normalizedAddress || "Calgary, AB",
      place_id: placeId,
      lat,
      lng,
      roof_area_sqft: ranges.roofAreaSqft,
      pitch_degrees: ranges.pitchDegrees,
      complexity_band: ranges.complexityBand,
      area_source: estimateResult.areaSource,
      data_source: estimateResult.dataSource
    });
  } catch (error) {
    console.error("instaquote estimate query insert failed", error);
  }

  return NextResponse.json({
    ok: true,
    addressQueryId,
    address: normalizedAddress || "Calgary, AB",
    placeId,
    lat,
    lng,
    roofAreaSqft: ranges.roofAreaSqft,
    roofSquares: ranges.roofSquares,
    pitchDegrees: ranges.pitchDegrees,
    pitchRatio: degreesToPitchRatio(ranges.pitchDegrees),
    dataSource: estimateResult.dataSource,
    areaSource: estimateResult.areaSource,
    complexityBand: ranges.complexityBand,
    complexityScore: ranges.complexityScore,
    ranges,
    solarDebug
  });
}
