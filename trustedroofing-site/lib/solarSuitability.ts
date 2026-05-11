import {
  extractCity,
  extractNeighborhood,
  extractQuadrant,
  neighborhoodSlug,
  normalizeLocalityCandidate,
} from "./serviceAreas";

export type SolarSourceType = "quote" | "project" | "solar";

export type SolarSuitabilityLookupInput = {
  sourceType: SolarSourceType;
  sourceId: string;
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  quadrant?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  roofAreaSqft?: number | null;
  pitchDegrees?: number | null;
  solarIntent?: boolean;
  publicActivity?: boolean;
  rawSolarPayload?: Record<string, unknown> | null;
};

export type SolarSuitabilityRecordInput = {
  source_type: SolarSourceType;
  source_id: string;
  address_snapshot: string | null;
  neighborhood: string;
  neighborhood_slug: string;
  city: string;
  quadrant: string | null;
  latitude: number | null;
  longitude: number | null;
  solar_intent: boolean;
  public_activity: boolean;
  usable_roof_area: number | null;
  roof_area: number | null;
  roof_pitch: number | null;
  roof_orientation: string | null;
  shade_score: number | null;
  solar_score: number | null;
  suitability_summary: string | null;
  raw_solar_payload: Record<string, unknown> | null;
};

type SolarApiSnapshot = {
  wholeRoofStats?: {
    areaMeters2?: number;
    pitchDegrees?: number;
  };
  maxArrayAreaMeters2?: number;
  maxSunshineHoursPerYear?: number;
  roofSegmentStats?: Array<{
    azimuthDegrees?: number;
    pitchDegrees?: number;
    stats?: { areaMeters2?: number; sunshineQuantiles?: number[] };
  }>;
};

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function sqftFromM2(value: unknown) {
  const numberValue = finiteNumber(value);
  return numberValue === null ? null : Math.round(numberValue * 10.7639);
}

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function directionFromAzimuth(value: number | null) {
  if (value === null) return null;
  const directions = [
    "north",
    "northeast",
    "east",
    "southeast",
    "south",
    "southwest",
    "west",
    "northwest",
  ];
  const index = Math.round((((value % 360) + 360) % 360) / 45) % 8;
  return directions[index];
}

function dominantOrientation(segments: SolarApiSnapshot["roofSegmentStats"]) {
  const weighted = (segments ?? [])
    .map((segment) => ({
      azimuth: finiteNumber(segment.azimuthDegrees),
      area: finiteNumber(segment.stats?.areaMeters2) ?? 0,
    }))
    .filter((segment) => segment.azimuth !== null && segment.area > 0)
    .sort((a, b) => b.area - a.area);

  return directionFromAzimuth(weighted[0]?.azimuth ?? null);
}

function solarScoreFromSnapshot(snapshot: SolarApiSnapshot | null) {
  if (!snapshot) return null;
  const sunHours = finiteNumber(snapshot.maxSunshineHoursPerYear);
  const usableArea = finiteNumber(snapshot.maxArrayAreaMeters2);
  if (sunHours === null && usableArea === null) return null;

  const sunScore =
    sunHours === null
      ? 50
      : Math.min(100, Math.max(0, (sunHours / 1800) * 100));
  const areaScore =
    usableArea === null
      ? 50
      : Math.min(100, Math.max(0, (usableArea / 80) * 100));
  return Math.round(sunScore * 0.65 + areaScore * 0.35);
}

function shadeScoreFromSnapshot(snapshot: SolarApiSnapshot | null) {
  const quantiles =
    snapshot?.roofSegmentStats
      ?.flatMap((segment) =>
        Array.isArray(segment.stats?.sunshineQuantiles)
          ? segment.stats!.sunshineQuantiles!
          : [],
      )
      .filter((value) => typeof value === "number" && Number.isFinite(value)) ??
    [];

  if (quantiles.length === 0) return null;
  const average =
    quantiles.reduce((sum, value) => sum + value, 0) / quantiles.length;
  return Math.round(Math.min(100, Math.max(0, (average / 1800) * 100)));
}

function summarize(
  score: number | null,
  usableRoofArea: number | null,
  roofOrientation: string | null,
) {
  const parts = [
    "Solar suitability modeling is available for this local activity signal",
  ];
  if (score !== null) {
    parts.push(
      score >= 75
        ? "with strong modeled solar exposure"
        : score >= 50
          ? "with moderate modeled solar exposure"
          : "with limited modeled solar exposure",
    );
  }
  if (usableRoofArea !== null)
    parts.push(
      `and about ${usableRoofArea.toLocaleString()} sq. ft. of modeled usable roof area`,
    );
  if (roofOrientation)
    parts.push(`with a dominant ${roofOrientation} roof orientation`);
  return `${parts.join(" ")}.`;
}

async function fetchGoogleSolarSnapshot(
  latitude: number | null,
  longitude: number | null,
) {
  const key = process.env.GOOGLE_SECRET_KEY;
  if (!key || latitude === null || longitude === null) return null;

  const params = new URLSearchParams({
    key,
    "location.latitude": String(latitude),
    "location.longitude": String(longitude),
    requiredQuality: "MEDIUM",
  });

  const response = await fetch(
    `https://solar.googleapis.com/v1/buildingInsights:findClosest?${params.toString()}`,
    { cache: "no-store" },
  );
  if (!response.ok) return null;
  return (await response.json()) as Record<string, unknown>;
}

export async function buildSolarSuitabilityRecord(
  input: SolarSuitabilityLookupInput,
): Promise<SolarSuitabilityRecordInput | null> {
  const city = titleCase(input.city ?? extractCity(input.address) ?? "Calgary");
  const neighborhood =
    normalizeLocalityCandidate(input.neighborhood, city) ??
    normalizeLocalityCandidate(extractNeighborhood(input.address), city);
  if (!neighborhood) return null;

  const latitude = input.latitude ?? null;
  const longitude = input.longitude ?? null;
  const fetchedPayload =
    input.rawSolarPayload ??
    (await fetchGoogleSolarSnapshot(latitude, longitude));
  const buildingInsights = (fetchedPayload?.buildingInsights ??
    fetchedPayload) as Record<string, unknown> | null;
  const potential = (buildingInsights?.solarPotential ??
    {}) as SolarApiSnapshot;
  const roof = potential.wholeRoofStats;
  const usableRoofArea = sqftFromM2(potential.maxArrayAreaMeters2);
  const roofArea = sqftFromM2(roof?.areaMeters2) ?? input.roofAreaSqft ?? null;
  const roofPitch =
    finiteNumber(roof?.pitchDegrees) ?? input.pitchDegrees ?? null;
  const roofOrientation = dominantOrientation(potential.roofSegmentStats);
  const solarScore = solarScoreFromSnapshot(potential);
  const shadeScore = shadeScoreFromSnapshot(potential);

  return {
    source_type: input.sourceType,
    source_id: input.sourceId,
    address_snapshot: input.address
      ? titleCase(input.address.split(",").slice(-3).join(", ").trim() || city)
      : null,
    neighborhood,
    neighborhood_slug:
      city === "Calgary"
        ? neighborhoodSlug(neighborhood)
        : neighborhoodSlug(`${city}-${neighborhood}`),
    city,
    quadrant: extractQuadrant(input.quadrant ?? input.address) ?? null,
    latitude,
    longitude,
    solar_intent: input.solarIntent ?? input.sourceType === "solar",
    public_activity: input.publicActivity ?? input.sourceType === "solar",
    usable_roof_area: usableRoofArea,
    roof_area: roofArea,
    roof_pitch: roofPitch,
    roof_orientation: roofOrientation,
    shade_score: shadeScore,
    solar_score: solarScore,
    suitability_summary: summarize(solarScore, usableRoofArea, roofOrientation),
    raw_solar_payload: fetchedPayload,
  };
}
