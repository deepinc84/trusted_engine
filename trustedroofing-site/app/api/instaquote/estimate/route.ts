import { NextResponse } from "next/server";
import { buildEstimateRanges, complexityBandFromSegments, regionalRoofEstimate } from "@/lib/quote";
import { createInstaquoteAddressQuery } from "@/lib/db";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";

type EstimateBody = {
  address?: string;
  placeId?: string;
  lat?: number | null;
  lng?: number | null;
  serviceScope?: "roofing" | "all" | "vinyl_siding" | "hardie_siding" | "eavestrough";
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
  diagnostics: {
    requestId: string;
    keyPresent: boolean;
    attempts: Array<{
      quality: "HIGH" | "MEDIUM";
      ok: boolean;
      status: number | null;
      error: string | null;
      imageryQuality: string | null;
      hasWholeRoofArea: boolean;
    }>;
  };
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

const MINIMUM_PRICING_ROOF_AREA_SQFT = 1200;

const EAVES_RATE_LOW = 8;
const EAVES_RATE_HIGH = 10;
const SIDING_VINYL_RATE_LOW = 8;
const SIDING_VINYL_RATE_HIGH = 9.5;
const EAVES_RATIO_BASELINE = 0.109;
const SIDING_RATIO_BASELINE = 1.55;


function mapScopeToRequestedScopes(scope: EstimateBody["serviceScope"]) {
  if (scope === "all") return ["roof", "eavestrough", "siding_vinyl", "siding_hardie"];
  if (scope === "vinyl_siding") return ["siding_vinyl"];
  if (scope === "hardie_siding") return ["siding_hardie"];
  if (scope === "eavestrough") return ["eavestrough"];
  return ["roof"];
}

function mapScopeToServiceType(scope: EstimateBody["serviceScope"]) {
  if (scope === "all") return "InstantQuote:All";
  if (scope === "vinyl_siding") return "InstantQuote:SidingVinyl";
  if (scope === "hardie_siding") return "InstantQuote:SidingHardie";
  if (scope === "eavestrough") return "InstantQuote:Eavestrough";
  return "InstantQuote:Roof";
}

function eavesComplexityMultiplier(complexityBand: "simple" | "moderate" | "complex") {
  if (complexityBand === "simple") return 0.95;
  if (complexityBand === "complex") return 1.08;
  return 1;
}

async function solarEstimate(lat: number, lng: number): Promise<SolarEstimateResult> {
  const key = process.env.GOOGLE_SECRET_KEY;
  const requestId = crypto.randomUUID();
  if (!key) {
    return {
      result: null,
      debugReason: "missing GOOGLE_SECRET_KEY",
      diagnostics: {
        requestId,
        keyPresent: false,
        attempts: []
      }
    };
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
        status: response.status,
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

    return { data, status: response.status, error: null as string | null };
  };

  const high = await call("HIGH");
  const medium = high.data ? null : await call("MEDIUM");
  const data = high.data ?? medium?.data ?? null;

  const roof = data?.solarPotential?.wholeRoofStats;
  const segments = data?.solarPotential?.roofSegmentStats ?? [];

  if (!roof?.areaMeters2) {
    const reason = [high.error, medium?.error ?? null].filter(Boolean).join(" | ") || "solar response missing wholeRoofStats.areaMeters2";
    return {
      result: null,
      debugReason: reason,
      diagnostics: {
        requestId,
        keyPresent: true,
        attempts: [high, medium].filter(Boolean).map((attempt) => ({
          quality: attempt!.data?.imageryQuality === "HIGH" ? "HIGH" : attempt === high ? "HIGH" : "MEDIUM",
          ok: !attempt!.error,
          status: attempt!.status ?? null,
          error: attempt!.error,
          imageryQuality: attempt!.data?.imageryQuality ?? null,
          hasWholeRoofArea: Boolean(attempt!.data?.solarPotential?.wholeRoofStats?.areaMeters2)
        }))
      }
    };
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
    debugReason: null,
    diagnostics: {
      requestId,
      keyPresent: true,
      attempts: [high, medium].filter(Boolean).map((attempt) => ({
        quality: attempt!.data?.imageryQuality === "HIGH" ? "HIGH" : attempt === high ? "HIGH" : "MEDIUM",
        ok: !attempt!.error,
        status: attempt!.status ?? null,
        error: attempt!.error,
        imageryQuality: attempt!.data?.imageryQuality ?? null,
        hasWholeRoofArea: Boolean(attempt!.data?.solarPotential?.wholeRoofStats?.areaMeters2)
      }))
    }
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

  const serviceScope = body.serviceScope ?? "roofing";
  const requestedScopes = mapScopeToRequestedScopes(serviceScope);
  const serviceType = mapScopeToServiceType(serviceScope);

  let normalizedAddress = body.address?.trim() ?? "";
  let placeId = body.placeId ?? null;
  const inputLat = body.lat ?? null;
  const inputLng = body.lng ?? null;
  let lat = inputLat;
  let lng = inputLng;

  let geocodeSource: "input" | "google_geocode" | "nominatim" | "none" = lat !== null && lng !== null ? "input" : "none";
  let geocodeDebug: string | null = null;

  if (normalizedAddress) {
    const googleGeocoded = await geocodeAddress(normalizedAddress);
    if (googleGeocoded) {
      normalizedAddress = googleGeocoded.address;
      placeId = googleGeocoded.placeId;
      lat = googleGeocoded.lat;
      lng = googleGeocoded.lng;
      geocodeSource = "google_geocode";
    } else {
      const nominatimGeocoded = await geocodeAddressNominatim(normalizedAddress);
      if (nominatimGeocoded) {
        normalizedAddress = nominatimGeocoded.address;
        placeId = nominatimGeocoded.placeId;
        lat = nominatimGeocoded.lat;
        lng = nominatimGeocoded.lng;
        geocodeSource = "nominatim";
        geocodeDebug = "google geocode failed; used nominatim coordinates";
      } else if (inputLat !== null && inputLng !== null) {
        geocodeSource = "input";
        geocodeDebug = "address geocode failed; using provided coordinates";
      } else {
        geocodeSource = "none";
        geocodeDebug = "address geocode failed and no fallback coordinates provided";
      }
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
  let solarDiagnostics: SolarEstimateResult["diagnostics"] = {
    requestId: crypto.randomUUID(),
    keyPresent: Boolean(process.env.GOOGLE_SECRET_KEY),
    attempts: []
  };

  if (lat !== null && lng !== null) {
    const solar = await solarEstimate(lat, lng);
    estimateResult = solar.result;
    solarDebug = solar.debugReason;
    solarDiagnostics = solar.diagnostics;
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

  const shouldApplyMinimumPricingFloor = estimateResult.areaSource !== "solar";
  const pricingRoofAreaSqft = shouldApplyMinimumPricingFloor
    ? Math.max(MINIMUM_PRICING_ROOF_AREA_SQFT, estimateResult.roofAreaSqft)
    : estimateResult.roofAreaSqft;
  const areaAdjustedToMinimum = pricingRoofAreaSqft !== estimateResult.roofAreaSqft;

  if (areaAdjustedToMinimum) {
    console.info("[instaquote][minimum_area_floor_applied]", {
      address: normalizedAddress || "Calgary, AB",
      service_type: serviceType,
      requested_scopes: requestedScopes,
      originalRoofAreaSqft: estimateResult.roofAreaSqft,
      adjustedRoofAreaSqft: pricingRoofAreaSqft,
      minimumPricingRoofAreaSqft: MINIMUM_PRICING_ROOF_AREA_SQFT,
      dataSource: estimateResult.dataSource,
      areaSource: estimateResult.areaSource
    });
  }

  const ranges = buildEstimateRanges({
    roofAreaSqft: pricingRoofAreaSqft,
    pitchDegrees: estimateResult.pitchDegrees,
    complexityBand: estimateResult.complexityBand
  });

  const complexityMultiplier = eavesComplexityMultiplier(ranges.complexityBand);
  const eavesLf = Math.round(ranges.roofAreaSqft * EAVES_RATIO_BASELINE * complexityMultiplier);
  const sidingSqft = Math.round(ranges.roofAreaSqft * SIDING_RATIO_BASELINE);
  const extras = {
    assumedStories: 2 as const,
    eavesLf,
    eaves: {
      low: Math.round(eavesLf * EAVES_RATE_LOW),
      high: Math.round(eavesLf * EAVES_RATE_HIGH)
    },
    sidingSqft,
    sidingVinyl: {
      low: Math.round(sidingSqft * SIDING_VINYL_RATE_LOW),
      high: Math.round(sidingSqft * SIDING_VINYL_RATE_HIGH)
    },
    sidingHardie: {
      low: Math.round(sidingSqft * SIDING_VINYL_RATE_LOW * 2),
      high: Math.round(sidingSqft * SIDING_VINYL_RATE_HIGH * 2)
    }
  };

  let addressQueryId = crypto.randomUUID();
  try {
    addressQueryId = await createInstaquoteAddressQuery({
      address: normalizedAddress || "Calgary, AB",
      service_type: serviceType,
      requested_scopes: requestedScopes,
      place_id: placeId,
      lat,
      lng,
      roof_area_sqft: ranges.roofAreaSqft,
      pitch_degrees: ranges.pitchDegrees,
      complexity_band: ranges.complexityBand,
      area_source: estimateResult.areaSource,
      data_source: estimateResult.dataSource,
      estimate_low: ranges.good.low,
      estimate_high: ranges.good.high,
      solar_status: estimateResult.areaSource === "solar" ? "success" : "fallback",
      solar_debug: {
        geocodeSource,
        geocodeDebug,
        reason: solarDebug,
        requestId: solarDiagnostics.requestId,
        keyPresent: solarDiagnostics.keyPresent,
        attempts: solarDiagnostics.attempts,
        minimumPricingRoofAreaSqft: MINIMUM_PRICING_ROOF_AREA_SQFT,
        areaAdjustedToMinimum,
        originalRoofAreaSqft: estimateResult.roofAreaSqft,
        pricingRoofAreaSqft,
        shouldApplyMinimumPricingFloor
      }
    }, {
      notesExtras: {
        ...extras,
        serviceScope,
        requestedScopes
      },
      requestedScopes,
      serviceType
    });
  } catch (error) {
    console.error("instaquote estimate query insert failed", error);
  }

  if (estimateResult.areaSource !== "solar") {
    console.warn("[instaquote][solar_fallback]", {
      address: normalizedAddress || "Calgary, AB",
      geocodeSource,
      solarDebug,
      solarRequestId: solarDiagnostics.requestId,
      attempts: solarDiagnostics.attempts
    });
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
    solarDebug,
    solarRequestId: solarDiagnostics.requestId,
    geocodeSource,
    geocodeDebug,
    solarAttempts: solarDiagnostics.attempts,
    minimumPricingRoofAreaSqft: MINIMUM_PRICING_ROOF_AREA_SQFT,
    areaAdjustedToMinimum,
    originalRoofAreaSqft: estimateResult.roofAreaSqft,
    pricingRoofAreaSqft,
    shouldApplyMinimumPricingFloor,
    extras
  });
}
