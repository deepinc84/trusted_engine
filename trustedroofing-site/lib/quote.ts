export const quoteScopes = [
  { value: "roofing", label: "Roof" },
  { value: "all", label: "All exterior scopes" },
  { value: "vinyl_siding", label: "Vinyl siding" },
  { value: "hardie_siding", label: "Hardie siding" },
  { value: "eavestrough", label: "Eavestrough" }
] as const;

export type QuoteScope = (typeof quoteScopes)[number]["value"];

export function defaultServiceTypeFromScope(scope: QuoteScope) {
  switch (scope) {
    case "all":
      return "All exterior scopes";
    case "vinyl_siding":
      return "Vinyl siding";
    case "hardie_siding":
      return "Hardie siding";
    case "eavestrough":
      return "Eavestrough";
    default:
      return "Roofing";
  }
}

export const pricingConfig = {
  eavesPerLinearFoot: [16, 29] as const,
  sidingPerSqft: [9, 18] as const,
  regionalSqftRanges: {
    NE: [1200, 2400],
    NW: [1400, 2800],
    SE: [1300, 2600],
    SW: [1500, 3200],
    default: [1300, 2600]
  }
} as const;

export type ComplexityBand = "simple" | "moderate" | "complex";

export const BASE_RATE_PER_SQUARE = 580;
export const LOW_RANGE_FACTOR = 0.94;
export const HIGH_RANGE_FACTOR = 1.06;

export type PitchSection = {
  areaSqft: number;
  pitchRatio?: number;
  pitchDegrees?: number;
};

export function roundToNearest50(value: number) {
  return Math.round(value / 50) * 50;
}

export function pitchDegreesToRatio(pitchDegrees: number) {
  return 12 * Math.tan((pitchDegrees * Math.PI) / 180);
}

export function getFacetAdjustment(facetCount?: number | null) {
  if (!facetCount || facetCount <= 5) return 0;
  if (facetCount <= 12) return (facetCount - 5) * 0.01;
  return Math.min(0.07 + ((facetCount - 12) * 0.015), 0.20);
}

export function getPitchSurchargePerSquare(pitchRatio?: number | null) {
  if (!pitchRatio || pitchRatio <= 6) return 0;
  return (pitchRatio - 6) * 10;
}

export function calculatePitchSurcharge(
  roofAreaSqft: number,
  pitchRatio?: number | null,
  pitchSections?: PitchSection[]
) {
  const validSections = pitchSections?.map((section) => ({
    areaSqft: Number(section.areaSqft),
    pitchRatio: section.pitchRatio ?? (section.pitchDegrees === undefined
      ? undefined
      : pitchDegreesToRatio(section.pitchDegrees))
  })).filter((section) => section.areaSqft > 0 && Number.isFinite(section.areaSqft)) ?? [];

  if (validSections.length > 0) {
    const totalPitchAreaSqft = validSections.reduce((total, section) => total + section.areaSqft, 0);
    return validSections.reduce((total, section) => {
      const normalizedSectionSquares = (roofAreaSqft * section.areaSqft / totalPitchAreaSqft) / 100;
      return total + normalizedSectionSquares * getPitchSurchargePerSquare(section.pitchRatio);
    }, 0);
  }

  return (roofAreaSqft / 100) * getPitchSurchargePerSquare(pitchRatio);
}

export function calculateRoofEstimate(input: {
  roofAreaSqft: number;
  facetCount?: number | null;
  pitchRatio?: number | null;
  pitchDegrees?: number | null;
  pitchSections?: PitchSection[];
  dataSource?: string;
}) {
  const roofSquares = input.roofAreaSqft / 100;
  const basePrice = roofSquares * BASE_RATE_PER_SQUARE;
  const pitchRatio = input.pitchRatio ?? (input.pitchDegrees === null || input.pitchDegrees === undefined
    ? undefined
    : pitchDegreesToRatio(input.pitchDegrees));
  const pitchSurcharge = calculatePitchSurcharge(input.roofAreaSqft, pitchRatio, input.pitchSections);
  const facetAdjustment = getFacetAdjustment(input.facetCount);
  const center = (basePrice + pitchSurcharge) * (1 + facetAdjustment);

  return {
    low: roundToNearest50(center * LOW_RANGE_FACTOR),
    high: roundToNearest50(center * HIGH_RANGE_FACTOR),
    center,
    roofSquares,
    baseRate: BASE_RATE_PER_SQUARE,
    facetAdjustment,
    pitchSurcharge
  };
}

export function calculateHardieRange(vinylLow: number, vinylHigh: number) {
  return {
    low: roundToNearest50(vinylLow * 1.5),
    high: roundToNearest50(vinylHigh * 1.8)
  };
}

export function complexityBandFromSegments(segmentCount: number): ComplexityBand {
  // Keep parity with legacy Mega Roofing logic:
  // low <= 5, medium <= 12, high > 12.
  // Mapped to simple / moderate / complex here.
  if (segmentCount <= 5) return "simple";
  if (segmentCount <= 12) return "moderate";
  return "complex";
}

export function complexityScoreForBand(band: ComplexityBand) {
  switch (band) {
    case "simple":
      return 1;
    case "moderate":
      return 2;
    case "complex":
      return 3;
    default:
      return 2;
  }
}

export function roofSquaresFromSqft(roofAreaSqft: number) {
  const raw = roofAreaSqft / 100;
  return Math.round(raw * 10) / 10;
}

export function buildEstimateRanges(input: {
  roofAreaSqft: number;
  pitchDegrees: number;
  complexityBand: ComplexityBand;
  areaSource?: "solar" | "regional";
  facetCount?: number;
  pitchSections?: PitchSection[];
}) {
  const roofEstimate = calculateRoofEstimate({
    roofAreaSqft: input.roofAreaSqft,
    facetCount: input.facetCount,
    pitchDegrees: input.pitchDegrees,
    pitchSections: input.pitchSections
  });
  const roofSquares = roofEstimate.roofSquares;
  const good = { low: roofEstimate.low, high: roofEstimate.high };
  // Preserve the existing upgrade relationships, but anchor every tier to calibrated Good pricing.
  const better = { low: roundToNearest50(good.low * (700 / 520)), high: roundToNearest50(good.high * (920 / 700)) };
  const best = { low: roundToNearest50(good.low * (920 / 520)), high: roundToNearest50(good.high * (1220 / 700)) };

  const linearFeet = Math.max(100, Math.round(Math.sqrt(input.roofAreaSqft) * 4));
  const eavesLow = Math.round(linearFeet * pricingConfig.eavesPerLinearFoot[0]);
  const eavesHigh = Math.round(linearFeet * pricingConfig.eavesPerLinearFoot[1]);

  const sidingArea = Math.round(input.roofAreaSqft * 0.75);
  const sidingLow = Math.round(sidingArea * pricingConfig.sidingPerSqft[0]);
  const sidingHigh = Math.round(sidingArea * pricingConfig.sidingPerSqft[1]);

  return {
    roofAreaSqft: Math.round(input.roofAreaSqft),
    roofSquares,
    pitchDegrees: Math.round(input.pitchDegrees * 10) / 10,
    complexityBand: input.complexityBand,
    complexityScore: complexityScoreForBand(input.complexityBand),
    good,
    better,
    best,
    eaves: { low: eavesLow, high: eavesHigh },
    siding: { low: sidingLow, high: sidingHigh }
  };
}

export function regionalRoofEstimate(input: {
  address?: string;
  lat?: number | null;
  lng?: number | null;
}) {
  const address = (input.address ?? "").toUpperCase();
  const quadrant: "NE" | "NW" | "SE" | "SW" | "default" =
    address.includes(" NE")
      ? "NE"
      : address.includes(" NW")
        ? "NW"
        : address.includes(" SE")
          ? "SE"
          : address.includes(" SW")
            ? "SW"
            : "default";

  const range = pricingConfig.regionalSqftRanges[quadrant];
  const midpoint = Math.round((range[0] + range[1]) / 2);

  return {
    roofAreaSqft: midpoint,
    roofSquares: roofSquaresFromSqft(midpoint),
    pitchDegrees: 25,
    complexityBand: "moderate" as ComplexityBand,
    complexityScore: 2,
    regionalRanges: {
      lowSqft: range[0],
      highSqft: range[1],
      quadrant
    }
  };
}
