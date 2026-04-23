import { NextResponse } from "next/server";
import { buildEstimateRanges, complexityBandFromSegments, regionalRoofEstimate } from "@/lib/quote";
import {
  createInstaquoteAddressQuery,
  findHistoricalRoofProfile,
  refreshInstaquoteAddressQuery,
  upsertInstantQuoteFromAddressQuery
} from "@/lib/db";
import { extractNeighborhood, normalizeLocalityCandidate } from "@/lib/serviceAreas";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";

type EstimateBody = {
  address?: string;
  placeId?: string;
  lat?: number | null;
  lng?: number | null;
  testMode?: boolean;
  benchmarkQuotedAmount?: number | null;
  benchmarkLabel?: string | null;
  serviceScope?: "roofing" | "all" | "vinyl_siding" | "hardie_siding" | "eavestrough";
};

type ComplexityBand = "simple" | "moderate" | "complex";

type SolarSegmentSummary = {
  areaSqft: number;
  groundAreaSqft: number;
  pitchDegrees: number;
  planeHeightFt: number;
};

type EstimateCore = {
  roofAreaSqft: number;
  pitchDegrees: number;
  complexityBand: ComplexityBand;
  dataSource: string;
  areaSource: "solar" | "regional";
  roofGroundAreaSqft?: number;
  roofHeightDeltaFt?: number;
  dominantPitchDegrees?: number;
  weightedPitchDegrees?: number;
  segmentCount?: number;
  roofSegmentsSummary?: SolarSegmentSummary[];
};

type EstimateRanges = ReturnType<typeof buildEstimateRanges>;

type QuoteExtras = {
  assumedStories: 2;
  eavesLf: number;
  eaves: { low: number; high: number };
  sidingSqft: number;
  sidingVinyl: { low: number; high: number };
  sidingHardie: { low: number; high: number };
};

type QuoteModel = {
  ranges: EstimateRanges;
  extras: QuoteExtras;
  shouldApplyMinimumPricingFloor: boolean;
  areaAdjustedToMinimum: boolean;
  pricingRoofAreaSqft: number;
};

type ExperimentalDiagnostics = {
  roofGroundAreaSqft: number;
  roofHeightDeltaFt: number;
  weightedPitchDegrees: number;
  estimatedWallHeightFt: number;
  sidingPerimeterLf: number;
  segmentCount: number;
  sidingModel: string;
  hardieModel: string;
  sidingConfidence: "low" | "medium" | "high";
  hardieComplexityTier: "simple" | "moderate" | "complex" | "very_complex";
  hardieComplexityScore: number;
  estimatedWindowDoorCount: number;
  estimatedCornerLf: number;
  estimatedFasciaLf: number;
  eavesModel: string;
  roofModel: string;
  isValid: boolean;
  fallbackReason: string | null;
  roofAreaSqft: number;
  experimentalEavesLf: number;
  experimentalSidingSqft: number;
  adjustedHardieRateLow: number;
  adjustedHardieRateHigh: number;
  impliedLowRate: number;
  impliedHighRate: number;
  benchmarkLabel?: string;
  benchmarkQuotedAmount?: number;
  benchmarkImpliedRate?: number;
  benchmarkVarianceLow?: number;
  benchmarkVarianceHigh?: number;
  benchmarkPctLow?: number;
  benchmarkPctHigh?: number;
};

type ExperimentalBuildResult = {
  isUsable: boolean;
  value: QuoteModel | null;
  diagnostics: ExperimentalDiagnostics;
};

type SolarEstimateResult = {
  result: EstimateCore | null;
  debugReason: string | null;
  solarSnapshot: {
    buildingInsights: Record<string, unknown> | null;
    dataLayers: Record<string, unknown> | null;
  } | null;
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

type GoogleAddressComponent = { long_name: string; short_name: string; types: string[] };

function getComponent(components: GoogleAddressComponent[] | undefined, type: string) {
  const component = components?.find((entry) => entry.types.includes(type));
  return component?.long_name ?? component?.short_name ?? null;
}

function getGoogleNeighborhood(components: GoogleAddressComponent[] | undefined) {
  return (
    getComponent(components, "neighborhood")
    ?? getComponent(components, "sublocality_level_1")
    ?? getComponent(components, "sublocality_level_2")
    ?? getComponent(components, "sublocality")
    ?? null
  );
}

function normalizeNeighborhood(value: string | null | undefined) {
  return normalizeLocalityCandidate(value) ?? null;
}

function dataSourceLabel(code: string) {
  if (code.includes("solar")) return "Trusted internal roof modeling";
  if (code.includes("historical")) return "Trusted internal historical model";
  if (code.includes("regional")) return "Trusted regional intelligence model";
  return "Trusted internal pricing model";
}

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
    results?: Array<{
      formatted_address?: string;
      place_id?: string;
      geometry?: { location?: { lat?: number; lng?: number } };
      address_components?: GoogleAddressComponent[];
    }>;
  };

  const top = payload.results?.[0];
  if (payload.status !== "OK" || !top?.formatted_address) return null;

  return {
    address: top.formatted_address,
    placeId: top.place_id ?? null,
    lat: top.geometry?.location?.lat ?? null,
    lng: top.geometry?.location?.lng ?? null,
    neighborhood: normalizeNeighborhood(getGoogleNeighborhood(top.address_components))
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
    address?: {
      neighbourhood?: string;
      suburb?: string;
      city_district?: string;
    };
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
    lng,
    neighborhood: normalizeNeighborhood(top.address?.neighbourhood ?? top.address?.suburb ?? top.address?.city_district ?? null)
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

function eavesComplexityMultiplier(complexityBand: ComplexityBand) {
  if (complexityBand === "simple") return 0.95;
  if (complexityBand === "complex") return 1.08;
  return 1;
}

function perimeterComplexityMultiplier(complexityBand: ComplexityBand) {
  if (complexityBand === "simple") return 1;
  if (complexityBand === "complex") return 1.16;
  return 1.08;
}

function gableComplexityMultiplier(complexityBand: ComplexityBand) {
  if (complexityBand === "simple") return 0.95;
  if (complexityBand === "complex") return 1.08;
  return 1;
}

function estimatePerimeterFromFootprint(footprintSqft: number, complexityBand: ComplexityBand) {
  const basePerimeter = 4 * Math.sqrt(Math.max(footprintSqft, 100));
  return Math.round(basePerimeter * perimeterComplexityMultiplier(complexityBand));
}

function estimateWallHeightFt(roofGroundAreaSqft: number) {
  if (roofGroundAreaSqft < 900) return 8.5;
  if (roofGroundAreaSqft < 1600) return 9;
  if (roofGroundAreaSqft < 2400) return 9.5;
  return 10;
}

function estimateGableBonusSqft(perimeterLf: number, roofHeightDeltaFt: number, complexityBand: ComplexityBand) {
  const clampedRoofHeightDeltaFt = Math.max(0, Math.min(12, roofHeightDeltaFt));
  const gableBonus = perimeterLf * clampedRoofHeightDeltaFt * 0.12;
  return Math.round(gableBonus * gableComplexityMultiplier(complexityBand));
}

function estimateWindowDoorCount(input: {
  experimentalSidingSqft: number;
  complexityBand: ComplexityBand;
  segmentCount: number;
}) {
  const baseCount = input.experimentalSidingSqft < 1400
    ? 8
    : input.experimentalSidingSqft < 2200
      ? 12
      : input.experimentalSidingSqft < 3000
        ? 16
        : 22;
  const complexityAdd = input.complexityBand === "complex" ? 6 : input.complexityBand === "moderate" ? 3 : 0;
  const segmentAdd = input.segmentCount >= 10 ? 5 : input.segmentCount >= 6 ? 2 : 0;
  return Math.max(6, baseCount + complexityAdd + segmentAdd);
}

function estimateCornerLf(input: { sidingPerimeterLf: number; complexityBand: ComplexityBand; segmentCount: number }) {
  const multiplier = input.complexityBand === "complex" ? 1.35 : input.complexityBand === "moderate" ? 1.15 : 1;
  const segmentMultiplier = input.segmentCount >= 12 ? 1.2 : input.segmentCount >= 8 ? 1.1 : 1;
  return Math.round(input.sidingPerimeterLf * 0.45 * multiplier * segmentMultiplier);
}

function estimateFasciaLf(input: {
  eavesLf: number;
  roofAreaSqft: number;
  complexityBand: ComplexityBand;
}) {
  const baseline = input.complexityBand === "complex"
    ? input.roofAreaSqft * 0.17
    : input.complexityBand === "moderate"
      ? input.roofAreaSqft * 0.14
      : input.roofAreaSqft * 0.11;
  return Math.round(Math.max(input.eavesLf, baseline));
}

function buildHardieComplexityScore(input: {
  experimentalSidingSqft: number;
  roofHeightDeltaFt: number;
  estimatedWallHeightFt: number;
  segmentCount: number;
  estimatedWindowDoorCount: number;
  estimatedCornerLf: number;
  estimatedFasciaLf: number;
}) {
  const openingScore = input.estimatedWindowDoorCount * 1.5;
  const cornerScore = input.estimatedCornerLf / 20;
  const fasciaScore = input.estimatedFasciaLf / 30;
  const heightScore = (input.estimatedWallHeightFt >= 9.5 ? 2 : 0)
    + (input.estimatedWallHeightFt >= 10 ? 2 : 0)
    + (input.roofHeightDeltaFt >= 8 ? 2 : 0)
    + (input.roofHeightDeltaFt >= 14 ? 2 : 0);
  const segmentScore = (input.segmentCount >= 6 ? 2 : 0)
    + (input.segmentCount >= 10 ? 3 : 0)
    + (input.segmentCount >= 14 ? 3 : 0);
  const wallAreaScore = (input.experimentalSidingSqft >= 1400 ? 2 : 0)
    + (input.experimentalSidingSqft >= 2200 ? 3 : 0)
    + (input.experimentalSidingSqft >= 3000 ? 3 : 0);

  return openingScore + cornerScore + fasciaScore + heightScore + segmentScore + wallAreaScore;
}

function getHardieComplexityTier(score: number): "simple" | "moderate" | "complex" | "very_complex" {
  if (score < 18) return "simple";
  if (score < 28) return "moderate";
  if (score < 40) return "complex";
  return "very_complex";
}

function getHardieRateBandForTier(tier: "simple" | "moderate" | "complex" | "very_complex") {
  if (tier === "simple") return { low: 9.25, high: 10.75 };
  if (tier === "moderate") return { low: 11.25, high: 13.25 };
  if (tier === "complex") return { low: 13.75, high: 15.75 };
  return { low: 15.25, high: 17.75 };
}

function scoreOverflowAdjustment(score: number, tier: "simple" | "moderate" | "complex" | "very_complex") {
  if (tier === "moderate") return Math.max(0, score - 18) * 0.08;
  if (tier === "complex") return Math.max(0, score - 28) * 0.06;
  if (tier === "very_complex") return Math.max(0, score - 40) * 0.04;
  return 0;
}

function trimIntensityAdjustment(estimatedWindowDoorCount: number, estimatedCornerLf: number, estimatedFasciaLf: number) {
  return (estimatedWindowDoorCount >= 16 ? 0.35 : 0)
    + (estimatedWindowDoorCount >= 24 ? 0.35 : 0)
    + (estimatedCornerLf >= 160 ? 0.35 : 0)
    + (estimatedFasciaLf >= 250 ? 0.25 : 0)
    + (estimatedFasciaLf >= 350 ? 0.25 : 0);
}

function getSidingConfidence(input: {
  roofHeightDeltaFt: number;
  segmentCount: number;
  experimentalSidingSqft: number;
  legacySidingSqft: number;
  inferredHeightAggressively: boolean;
}): "low" | "medium" | "high" {
  const ratioDiff = Math.abs(input.experimentalSidingSqft - input.legacySidingSqft) / Math.max(input.legacySidingSqft, 1);
  if (input.roofHeightDeltaFt < 2 && ratioDiff > 0.35) return "low";
  if (input.inferredHeightAggressively && ratioDiff > 0.25) return "low";
  if (input.segmentCount >= 10 && input.roofHeightDeltaFt >= 7 && ratioDiff <= 0.3) return "high";
  if (input.segmentCount >= 8 && input.roofHeightDeltaFt >= 6) return "medium";
  return ratioDiff <= 0.2 ? "medium" : "low";
}

function buildExtrasFromInputs(
  roofAreaSqft: number,
  complexityBand: ComplexityBand,
  eavesLfOverride?: number,
  sidingSqftOverride?: number
): QuoteExtras {
  const complexityMultiplier = eavesComplexityMultiplier(complexityBand);
  const eavesLf = eavesLfOverride ?? Math.round(roofAreaSqft * EAVES_RATIO_BASELINE * complexityMultiplier);
  const sidingSqft = sidingSqftOverride ?? Math.round(roofAreaSqft * SIDING_RATIO_BASELINE);

  return {
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
}

function buildLegacyQuoteModel(estimateResult: EstimateCore): QuoteModel {
  const shouldApplyMinimumPricingFloor = estimateResult.areaSource !== "solar";
  const pricingRoofAreaSqft = shouldApplyMinimumPricingFloor
    ? Math.max(MINIMUM_PRICING_ROOF_AREA_SQFT, estimateResult.roofAreaSqft)
    : estimateResult.roofAreaSqft;

  const ranges = buildEstimateRanges({
    roofAreaSqft: pricingRoofAreaSqft,
    pitchDegrees: estimateResult.pitchDegrees,
    complexityBand: estimateResult.complexityBand,
    areaSource: estimateResult.areaSource
  });

  return {
    ranges,
    extras: buildExtrasFromInputs(ranges.roofAreaSqft, ranges.complexityBand),
    shouldApplyMinimumPricingFloor,
    areaAdjustedToMinimum: pricingRoofAreaSqft !== estimateResult.roofAreaSqft,
    pricingRoofAreaSqft
  };
}

function isFinitePositive(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function buildExperimentalTestQuoteModel(
  estimateResult: EstimateCore,
  legacyModel: QuoteModel,
  benchmarkQuotedAmount?: number,
  benchmarkLabel?: string
): ExperimentalBuildResult {
  const fallbackDiagnostics: ExperimentalDiagnostics = {
    roofGroundAreaSqft: estimateResult.roofGroundAreaSqft ?? 0,
    roofHeightDeltaFt: estimateResult.roofHeightDeltaFt ?? 0,
    weightedPitchDegrees:
      estimateResult.weightedPitchDegrees ?? estimateResult.dominantPitchDegrees ?? estimateResult.pitchDegrees,
    estimatedWallHeightFt: 0,
    sidingPerimeterLf: 0,
    segmentCount: estimateResult.segmentCount ?? 0,
    sidingModel: "existing_experimental_siding_v1",
    hardieModel: "scored_hardie_complexity_v2",
    sidingConfidence: "low",
    hardieComplexityTier: "simple",
    hardieComplexityScore: 0,
    estimatedWindowDoorCount: 0,
    estimatedCornerLf: 0,
    estimatedFasciaLf: 0,
    eavesModel: "solar_footprint_perimeter_v1",
    roofModel: "solar_weighted_pitch_v1",
    isValid: false,
    fallbackReason: "experimental model not initialized",
    roofAreaSqft: estimateResult.roofAreaSqft,
    experimentalEavesLf: legacyModel.extras.eavesLf,
    experimentalSidingSqft: legacyModel.extras.sidingSqft,
    adjustedHardieRateLow: 0,
    adjustedHardieRateHigh: 0,
    impliedLowRate: 0,
    impliedHighRate: 0,
    ...(benchmarkLabel ? { benchmarkLabel } : {}),
    ...(typeof benchmarkQuotedAmount === "number" ? { benchmarkQuotedAmount } : {})
  };

  if (!isFinitePositive(estimateResult.roofGroundAreaSqft)) {
    return {
      isUsable: false,
      value: null,
      diagnostics: { ...fallbackDiagnostics, fallbackReason: "missing roofGroundAreaSqft" }
    };
  }

  const weightedPitchDegrees =
    estimateResult.weightedPitchDegrees ?? estimateResult.dominantPitchDegrees ?? estimateResult.pitchDegrees;

  if (!Number.isFinite(weightedPitchDegrees) || weightedPitchDegrees < 0 || weightedPitchDegrees > 90) {
    return {
      isUsable: false,
      value: null,
      diagnostics: { ...fallbackDiagnostics, fallbackReason: "weighted pitch is invalid" }
    };
  }

  const shouldApplyMinimumPricingFloor = estimateResult.areaSource !== "solar";
  const pricingRoofAreaSqft = shouldApplyMinimumPricingFloor
    ? Math.max(MINIMUM_PRICING_ROOF_AREA_SQFT, estimateResult.roofAreaSqft)
    : estimateResult.roofAreaSqft;

  const ranges = buildEstimateRanges({
    roofAreaSqft: pricingRoofAreaSqft,
    pitchDegrees: weightedPitchDegrees,
    complexityBand: estimateResult.complexityBand,
    areaSource: estimateResult.areaSource
  });

  const roofGroundAreaSqft = estimateResult.roofGroundAreaSqft as number;
  const roofHeightDeltaFt = estimateResult.roofHeightDeltaFt ?? 0;
  const sidingPerimeterLf = estimatePerimeterFromFootprint(roofGroundAreaSqft, ranges.complexityBand);
  const estimatedWallHeightFt = estimateWallHeightFt(roofGroundAreaSqft);
  const baseWallAreaSqft = Math.round(sidingPerimeterLf * estimatedWallHeightFt);
  const gableBonusSqft = estimateGableBonusSqft(sidingPerimeterLf, roofHeightDeltaFt, ranges.complexityBand);
  const experimentalSidingSqft = Math.max(350, Math.round(baseWallAreaSqft + gableBonusSqft));
  const experimentalEavesLf = estimatePerimeterFromFootprint(roofGroundAreaSqft, ranges.complexityBand);

  const estimatedWindowDoorCount = estimateWindowDoorCount({
    experimentalSidingSqft,
    complexityBand: ranges.complexityBand,
    segmentCount: estimateResult.segmentCount ?? 0
  });

  const estimatedCornerLf = estimateCornerLf({
    sidingPerimeterLf,
    complexityBand: ranges.complexityBand,
    segmentCount: estimateResult.segmentCount ?? 0
  });

  const estimatedFasciaLf = estimateFasciaLf({
    eavesLf: experimentalEavesLf,
    roofAreaSqft: ranges.roofAreaSqft,
    complexityBand: ranges.complexityBand
  });

  const hardieComplexityScore = buildHardieComplexityScore({
    experimentalSidingSqft,
    roofHeightDeltaFt,
    estimatedWallHeightFt,
    segmentCount: estimateResult.segmentCount ?? 0,
    estimatedWindowDoorCount,
    estimatedCornerLf,
    estimatedFasciaLf
  });

  const hardieComplexityTier = getHardieComplexityTier(hardieComplexityScore);
  const tierBand = getHardieRateBandForTier(hardieComplexityTier);
  const scoreOverflowAdj = scoreOverflowAdjustment(hardieComplexityScore, hardieComplexityTier);
  const trimIntensityAdj = trimIntensityAdjustment(estimatedWindowDoorCount, estimatedCornerLf, estimatedFasciaLf);
  const adjustedHardieRateLow = Math.round((tierBand.low + scoreOverflowAdj + trimIntensityAdj) * 100) / 100;
  const adjustedHardieRateHigh = Math.round((tierBand.high + scoreOverflowAdj + trimIntensityAdj) * 100) / 100;
  const hardieLow = Math.round(experimentalSidingSqft * adjustedHardieRateLow);
  const hardieHigh = Math.round(experimentalSidingSqft * adjustedHardieRateHigh);

  const sidingConfidence = getSidingConfidence({
    roofHeightDeltaFt,
    segmentCount: estimateResult.segmentCount ?? 0,
    experimentalSidingSqft,
    legacySidingSqft: legacyModel.extras.sidingSqft,
    inferredHeightAggressively: roofHeightDeltaFt <= 0.5
  });

  const eavesMin = legacyModel.extras.eavesLf * 0.5;
  const eavesMax = legacyModel.extras.eavesLf * 2.5;
  const sidingMin = roofGroundAreaSqft * 0.35;
  const sidingMax = roofGroundAreaSqft * 3.25;

  let fallbackReason: string | null = null;
  const validNumbers = (
    [
      ranges.roofAreaSqft,
      ranges.pitchDegrees,
      experimentalEavesLf,
      experimentalSidingSqft,
      roofGroundAreaSqft
    ] as number[]
  ).every((value) => Number.isFinite(value) && value > 0);

  if (!validNumbers) {
    fallbackReason = "experimental values are non-finite";
  } else if (experimentalEavesLf < eavesMin || experimentalEavesLf > eavesMax) {
    fallbackReason = "experimental eaves outside sanity range";
  } else if (experimentalSidingSqft < sidingMin || experimentalSidingSqft > sidingMax) {
    fallbackReason = "experimental siding outside sanity range";
  } else if (
    !Number.isFinite(adjustedHardieRateLow)
    || !Number.isFinite(adjustedHardieRateHigh)
    || adjustedHardieRateLow <= 0
    || adjustedHardieRateHigh <= adjustedHardieRateLow
  ) {
    fallbackReason = "experimental hardie rates are invalid";
  } else if (adjustedHardieRateLow < 8.5 || adjustedHardieRateHigh > 19.5) {
    fallbackReason = "experimental hardie rates outside safety band";
  } else if (!Number.isFinite(hardieLow) || !Number.isFinite(hardieHigh) || hardieLow <= 0 || hardieHigh <= hardieLow) {
    fallbackReason = "experimental hardie range is invalid";
  }

  const impliedLowRate = hardieLow / experimentalSidingSqft;
  const impliedHighRate = hardieHigh / experimentalSidingSqft;
  const hasBenchmark =
    typeof benchmarkQuotedAmount === "number" && Number.isFinite(benchmarkQuotedAmount) && benchmarkQuotedAmount > 0;

  const benchmarkVarianceLow = hasBenchmark ? hardieLow - benchmarkQuotedAmount : undefined;
  const benchmarkVarianceHigh = hasBenchmark ? hardieHigh - benchmarkQuotedAmount : undefined;
  const benchmarkPctLow = hasBenchmark ? ((hardieLow - benchmarkQuotedAmount) / benchmarkQuotedAmount) * 100 : undefined;
  const benchmarkPctHigh = hasBenchmark ? ((hardieHigh - benchmarkQuotedAmount) / benchmarkQuotedAmount) * 100 : undefined;
  const benchmarkImpliedRate = hasBenchmark ? benchmarkQuotedAmount / experimentalSidingSqft : undefined;

  const diagnostics: ExperimentalDiagnostics = {
    roofGroundAreaSqft,
    roofHeightDeltaFt,
    weightedPitchDegrees,
    estimatedWallHeightFt,
    sidingPerimeterLf,
    segmentCount: estimateResult.segmentCount ?? 0,
    sidingModel: "existing_experimental_siding_v1",
    hardieModel: "scored_hardie_complexity_v2",
    sidingConfidence,
    hardieComplexityTier,
    hardieComplexityScore: Math.round(hardieComplexityScore * 10) / 10,
    estimatedWindowDoorCount,
    estimatedCornerLf,
    estimatedFasciaLf,
    eavesModel: "solar_footprint_perimeter_v1",
    roofModel: "solar_weighted_pitch_v1",
    isValid: fallbackReason === null,
    fallbackReason,
    roofAreaSqft: ranges.roofAreaSqft,
    experimentalEavesLf,
    experimentalSidingSqft,
    adjustedHardieRateLow,
    adjustedHardieRateHigh,
    impliedLowRate: Math.round(impliedLowRate * 100) / 100,
    impliedHighRate: Math.round(impliedHighRate * 100) / 100,
    ...(benchmarkLabel ? { benchmarkLabel } : {}),
    ...(hasBenchmark
      ? {
        benchmarkQuotedAmount,
        benchmarkImpliedRate: Math.round((benchmarkImpliedRate ?? 0) * 100) / 100,
        benchmarkVarianceLow,
        benchmarkVarianceHigh,
        benchmarkPctLow: Math.round((benchmarkPctLow ?? 0) * 10) / 10,
        benchmarkPctHigh: Math.round((benchmarkPctHigh ?? 0) * 10) / 10
      }
      : {})
  };

  if (fallbackReason) {
    return { isUsable: false, value: null, diagnostics };
  }

  const baseExtras = buildExtrasFromInputs(
    ranges.roofAreaSqft,
    ranges.complexityBand,
    experimentalEavesLf,
    experimentalSidingSqft
  );

  return {
    isUsable: true,
    value: {
      ranges,
      extras: {
        ...baseExtras,
        sidingHardie: {
          low: hardieLow,
          high: hardieHigh
        }
      },
      shouldApplyMinimumPricingFloor,
      areaAdjustedToMinimum: pricingRoofAreaSqft !== estimateResult.roofAreaSqft,
      pricingRoofAreaSqft
    },
    diagnostics
  };
}

async function solarEstimate(lat: number, lng: number): Promise<SolarEstimateResult> {
  const key = process.env.GOOGLE_SECRET_KEY;
  const requestId = crypto.randomUUID();

  if (!key) {
    return {
      result: null,
      debugReason: "missing GOOGLE_SECRET_KEY",
      solarSnapshot: null,
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
        wholeRoofStats?: { areaMeters2?: number; groundAreaMeters2?: number; pitchDegrees?: number };
        roofSegmentStats?: Array<{
          pitchDegrees?: number;
          planeHeightAtCenterMeters?: number;
          stats?: { areaMeters2?: number; groundAreaMeters2?: number };
        }>;
      };
      imageryQuality?: string;
      name?: string;
    };

    return { data, status: response.status, error: null as string | null };
  };

  const high = await call("HIGH");
  const medium = high.data ? null : await call("MEDIUM");
  const data = high.data ?? medium?.data ?? null;

  const toSolarSnapshot = (buildingInsights: Record<string, unknown> | null) => ({
    buildingInsights,
    dataLayers: null as null
  });

  const solarSnapshot = toSolarSnapshot(data as Record<string, unknown> | null);

  const roof = data?.solarPotential?.wholeRoofStats;
  const segments = data?.solarPotential?.roofSegmentStats ?? [];

  if (!roof?.areaMeters2) {
    const reason =
      [high.error, medium?.error ?? null].filter(Boolean).join(" | ")
      || "solar response missing wholeRoofStats.areaMeters2";

    return {
      result: null,
      debugReason: reason,
      solarSnapshot,
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

  const roofAreaSqft = Math.round(roof.areaMeters2 * 10.7639);
  const roofGroundAreaSqft = Number.isFinite(roof.groundAreaMeters2)
    ? Math.round((roof.groundAreaMeters2 ?? 0) * 10.7639)
    : Math.round(roofAreaSqft * 0.92);

  const segmentSummaries: SolarSegmentSummary[] = segments.map((segment) => ({
    areaSqft: (segment.stats?.areaMeters2 ?? 0) * 10.7639,
    groundAreaSqft: (segment.stats?.groundAreaMeters2 ?? 0) * 10.7639,
    pitchDegrees: segment.pitchDegrees ?? roof.pitchDegrees ?? 25,
    planeHeightFt: (segment.planeHeightAtCenterMeters ?? Number.NaN) * 3.28084
  }));

  const validHeights = segmentSummaries
    .map((segment) => segment.planeHeightFt)
    .filter((value) => Number.isFinite(value));

  const roofHeightDeltaFt = validHeights.length >= 2
    ? Math.max(...validHeights) - Math.min(...validHeights)
    : 0;

  const validSegments = segmentSummaries.filter((segment) => Number.isFinite(segment.areaSqft) && segment.areaSqft > 0);
  const segmentCount = validSegments.length;

  const avgPitch =
    segments.length > 0
      ? segments.reduce((sum, seg) => sum + (seg.pitchDegrees ?? 25), 0) / segments.length
      : (roof.pitchDegrees ?? 25);

  const weightedPitchDegrees = validSegments.length > 0
    ? validSegments.reduce((sum, segment) => sum + (segment.pitchDegrees * segment.areaSqft), 0)
      / validSegments.reduce((sum, segment) => sum + segment.areaSqft, 0)
    : avgPitch;

  return {
    result: {
      roofAreaSqft,
      roofGroundAreaSqft,
      roofHeightDeltaFt: Math.round(roofHeightDeltaFt * 10) / 10,
      dominantPitchDegrees: Math.round((roof.pitchDegrees ?? avgPitch) * 10) / 10,
      weightedPitchDegrees: Math.round(weightedPitchDegrees * 10) / 10,
      segmentCount,
      roofSegmentsSummary: segmentSummaries,
      pitchDegrees: Math.round(avgPitch * 10) / 10,
      complexityBand: complexityBandFromSegments(segments.length || 4),
      dataSource: "internal_model_solar",
      areaSource: "solar"
    },
    debugReason: null,
    solarSnapshot,
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
  const testMode = body.testMode === true || request.headers.get("x-instaquote-test-mode") === "1";
  const benchmarkQuotedAmount = typeof body.benchmarkQuotedAmount === "number" ? body.benchmarkQuotedAmount : undefined;
  const benchmarkLabel =
    typeof body.benchmarkLabel === "string" && body.benchmarkLabel.trim()
      ? body.benchmarkLabel.trim()
      : undefined;

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
  let neighborhood = normalizeNeighborhood(extractNeighborhood(normalizedAddress));

  if (normalizedAddress) {
    const googleGeocoded = await geocodeAddress(normalizedAddress);

    if (googleGeocoded) {
      normalizedAddress = googleGeocoded.address;
      placeId = googleGeocoded.placeId;
      lat = googleGeocoded.lat;
      lng = googleGeocoded.lng;
      geocodeSource = "google_geocode";
      neighborhood = googleGeocoded.neighborhood ?? neighborhood ?? normalizeNeighborhood(extractNeighborhood(googleGeocoded.address));
    } else {
      const nominatimGeocoded = await geocodeAddressNominatim(normalizedAddress);

      if (nominatimGeocoded) {
        normalizedAddress = nominatimGeocoded.address;
        placeId = nominatimGeocoded.placeId;
        lat = nominatimGeocoded.lat;
        lng = nominatimGeocoded.lng;
        geocodeSource = "nominatim";
        geocodeDebug = "google geocode failed; used nominatim coordinates";
        neighborhood =
          nominatimGeocoded.neighborhood ?? neighborhood ?? normalizeNeighborhood(extractNeighborhood(nominatimGeocoded.address));
      } else if (inputLat !== null && inputLng !== null) {
        geocodeSource = "input";
        geocodeDebug = "address geocode failed; using provided coordinates";
      } else {
        geocodeSource = "none";
        geocodeDebug = "address geocode failed and no fallback coordinates provided";
      }
    }
  }

  neighborhood = neighborhood ?? normalizeNeighborhood(extractNeighborhood(normalizedAddress));

  let estimateResult: EstimateCore | null = null;
  let historicalProfileMatch: Awaited<ReturnType<typeof findHistoricalRoofProfile>> = null;

  let solarDebug: string | null = null;
  let solarSnapshot: SolarEstimateResult["solarSnapshot"] = null;
  let solarDiagnostics: SolarEstimateResult["diagnostics"] = {
    requestId: crypto.randomUUID(),
    keyPresent: Boolean(process.env.GOOGLE_SECRET_KEY),
    attempts: []
  };

  if (lat !== null && lng !== null) {
    const solar = await solarEstimate(lat, lng);
    estimateResult = solar.result;
    solarDebug = solar.debugReason;
    solarSnapshot = solar.solarSnapshot;
    solarDiagnostics = solar.diagnostics;
  } else {
    solarDebug = "no lat/lng available for solar lookup";
  }

  if (!estimateResult && !testMode) {
    historicalProfileMatch = await findHistoricalRoofProfile({
      placeId,
      address: normalizedAddress,
      lat,
      lng
    });

    if (historicalProfileMatch) {
      estimateResult = {
        roofAreaSqft: historicalProfileMatch.roofAreaSqft,
        pitchDegrees: historicalProfileMatch.pitchDegrees,
        complexityBand: historicalProfileMatch.complexityBand,
        dataSource: `internal_model_historical_${historicalProfileMatch.areaSource}`,
        areaSource: historicalProfileMatch.areaSource
      };

      solarDebug = [solarDebug, `using historical profile matched by ${historicalProfileMatch.matchedBy} (${historicalProfileMatch.queriedAt})`]
        .filter(Boolean)
        .join(" | ");
    }
  }

  if (!estimateResult) {
    const regional = regionalRoofEstimate({ address: normalizedAddress, lat, lng });
    estimateResult = {
      roofAreaSqft: regional.roofAreaSqft,
      pitchDegrees: 25,
      complexityBand: "moderate",
      dataSource: "internal_model_regional",
      areaSource: "regional"
    };
  }

  const legacyModel = buildLegacyQuoteModel(estimateResult);

  if (legacyModel.areaAdjustedToMinimum) {
    console.info("[instaquote][minimum_area_floor_applied]", {
      address: normalizedAddress || "Calgary, AB",
      service_type: serviceType,
      requested_scopes: requestedScopes,
      originalRoofAreaSqft: estimateResult.roofAreaSqft,
      adjustedRoofAreaSqft: legacyModel.pricingRoofAreaSqft,
      minimumPricingRoofAreaSqft: MINIMUM_PRICING_ROOF_AREA_SQFT,
      dataSource: estimateResult.dataSource,
      areaSource: estimateResult.areaSource
    });
  }

  const experimentalModel = testMode
    ? buildExperimentalTestQuoteModel(estimateResult, legacyModel, benchmarkQuotedAmount, benchmarkLabel)
    : null;

  const usingExperimental = Boolean(testMode && experimentalModel?.isUsable && experimentalModel.value);
  const finalModel = usingExperimental ? experimentalModel!.value! : legacyModel;

  const selectedQuotedRange = serviceScope === "vinyl_siding"
    ? finalModel.extras.sidingVinyl
    : serviceScope === "hardie_siding"
      ? finalModel.extras.sidingHardie
      : serviceScope === "eavestrough"
        ? finalModel.extras.eaves
        : serviceScope === "all"
          ? {
            low: finalModel.ranges.good.low + finalModel.extras.eaves.low + finalModel.extras.sidingVinyl.low,
            high: finalModel.ranges.good.high + finalModel.extras.eaves.high + finalModel.extras.sidingVinyl.high
          }
          : finalModel.ranges.good;

  let addressQueryId = testMode ? `test_${crypto.randomUUID()}` : crypto.randomUUID();

  if (!testMode) {
    try {
      const queryPayload = {
        address: normalizedAddress || "Calgary, AB",
        neighborhood,
        service_type: serviceType,
        requested_scopes: requestedScopes,
        place_id: placeId,
        lat,
        lng,
        roof_area_sqft: finalModel.ranges.roofAreaSqft,
        pitch_degrees: finalModel.ranges.pitchDegrees,
        complexity_band: finalModel.ranges.complexityBand,
        area_source: estimateResult.areaSource,
        data_source: estimateResult.dataSource,
        estimate_low: selectedQuotedRange.low,
        estimate_high: selectedQuotedRange.high,
        solar_status: estimateResult.areaSource === "solar" ? "success" : "fallback",
        solar_debug: {
          geocodeSource,
          geocodeDebug,
          reason: solarDebug,
          requestId: solarDiagnostics.requestId,
          keyPresent: solarDiagnostics.keyPresent,
          attempts: solarDiagnostics.attempts,
          minimumPricingRoofAreaSqft: MINIMUM_PRICING_ROOF_AREA_SQFT,
          areaAdjustedToMinimum: finalModel.areaAdjustedToMinimum,
          originalRoofAreaSqft: estimateResult.roofAreaSqft,
          pricingRoofAreaSqft: finalModel.pricingRoofAreaSqft,
          shouldApplyMinimumPricingFloor: finalModel.shouldApplyMinimumPricingFloor
        }
      };

      const queryOptions = {
        notesExtras: {
          ...finalModel.extras,
          serviceScope,
          requestedScopes,
          selectedQuotedRange,
          roofRange: finalModel.ranges.good
        },
        requestedScopes,
        serviceType
      };

      if (historicalProfileMatch) {
        if (estimateResult.dataSource.startsWith("internal_model_historical_")) {
          addressQueryId = historicalProfileMatch.queryId;
          await refreshInstaquoteAddressQuery(addressQueryId, queryPayload, queryOptions);
        } else {
          addressQueryId = await createInstaquoteAddressQuery(queryPayload, queryOptions);
        }
      } else {
        addressQueryId = await createInstaquoteAddressQuery(queryPayload, queryOptions);
      }

      await upsertInstantQuoteFromAddressQuery({
        legacy_address_query_id: addressQueryId,
        address: normalizedAddress || "Calgary, AB",
        service_type: serviceType,
        quote_low: selectedQuotedRange.low,
        quote_high: selectedQuotedRange.high
      });
    } catch (error) {
      console.error("instaquote estimate query insert failed", error);
    }
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
    roofAreaSqft: finalModel.ranges.roofAreaSqft,
    roofSquares: finalModel.ranges.roofSquares,
    pitchDegrees: finalModel.ranges.pitchDegrees,
    pitchRatio: degreesToPitchRatio(finalModel.ranges.pitchDegrees),
    dataSource: estimateResult.dataSource,
    dataSourceLabel: dataSourceLabel(estimateResult.dataSource),
    areaSource: estimateResult.areaSource,
    complexityBand: finalModel.ranges.complexityBand,
    complexityScore: finalModel.ranges.complexityScore,
    ranges: finalModel.ranges,
    solarDebug,
    solarRequestId: solarDiagnostics.requestId,
    solarSnapshot,
    geocodeSource,
    geocodeDebug,
    solarAttempts: solarDiagnostics.attempts,
    minimumPricingRoofAreaSqft: MINIMUM_PRICING_ROOF_AREA_SQFT,
    areaAdjustedToMinimum: finalModel.areaAdjustedToMinimum,
    originalRoofAreaSqft: estimateResult.roofAreaSqft,
    pricingRoofAreaSqft: finalModel.pricingRoofAreaSqft,
    shouldApplyMinimumPricingFloor: finalModel.shouldApplyMinimumPricingFloor,
    extras: finalModel.extras,
    ...(testMode
      ? {
        pricingModel: usingExperimental ? "experimental_test" : "legacy",
        pricingFallbackUsed: !usingExperimental,
        legacyComparison: {
          roofAreaSqft: legacyModel.ranges.roofAreaSqft,
          pitchDegrees: legacyModel.ranges.pitchDegrees,
          eavesLf: legacyModel.extras.eavesLf,
          sidingSqft: legacyModel.extras.sidingSqft,
          hardieLow: legacyModel.extras.sidingHardie.low,
          hardieHigh: legacyModel.extras.sidingHardie.high,
          low: serviceScope === "all"
            ? legacyModel.ranges.good.low + legacyModel.extras.eaves.low + legacyModel.extras.sidingVinyl.low
            : serviceScope === "eavestrough"
              ? legacyModel.extras.eaves.low
              : serviceScope === "vinyl_siding"
                ? legacyModel.extras.sidingVinyl.low
                : serviceScope === "hardie_siding"
                  ? legacyModel.extras.sidingHardie.low
                  : legacyModel.ranges.good.low,
          high: serviceScope === "all"
            ? legacyModel.ranges.good.high + legacyModel.extras.eaves.high + legacyModel.extras.sidingVinyl.high
            : serviceScope === "eavestrough"
              ? legacyModel.extras.eaves.high
              : serviceScope === "vinyl_siding"
                ? legacyModel.extras.sidingVinyl.high
                : serviceScope === "hardie_siding"
                  ? legacyModel.extras.sidingHardie.high
                  : legacyModel.ranges.good.high
        },
        experimentalDiagnostics: experimentalModel?.diagnostics ?? {
          roofGroundAreaSqft: estimateResult.roofGroundAreaSqft ?? 0,
          roofHeightDeltaFt: estimateResult.roofHeightDeltaFt ?? 0,
          weightedPitchDegrees:
            estimateResult.weightedPitchDegrees ?? estimateResult.dominantPitchDegrees ?? estimateResult.pitchDegrees,
          estimatedWallHeightFt: 0,
          sidingPerimeterLf: 0,
          segmentCount: estimateResult.segmentCount ?? 0,
          sidingModel: "existing_experimental_siding_v1",
          hardieModel: "scored_hardie_complexity_v2",
          sidingConfidence: "low",
          hardieComplexityTier: "simple",
          hardieComplexityScore: 0,
          estimatedWindowDoorCount: 0,
          estimatedCornerLf: 0,
          estimatedFasciaLf: 0,
          eavesModel: "solar_footprint_perimeter_v1",
          roofModel: "solar_weighted_pitch_v1",
          isValid: false,
          fallbackReason: "experimental model unavailable",
          roofAreaSqft: legacyModel.ranges.roofAreaSqft,
          experimentalEavesLf: legacyModel.extras.eavesLf,
          experimentalSidingSqft: legacyModel.extras.sidingSqft,
          adjustedHardieRateLow: 0,
          adjustedHardieRateHigh: 0,
          impliedLowRate: 0,
          impliedHighRate: 0,
          ...(benchmarkLabel ? { benchmarkLabel } : {}),
          ...(typeof benchmarkQuotedAmount === "number" ? { benchmarkQuotedAmount } : {})
        }
      }
      : {})
  });
}
