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
  roofPerSquareGood: [520, 700] as const,
  roofPerSquareBetter: [700, 920] as const,
  roofPerSquareBest: [920, 1220] as const,
  eavesPerLinearFoot: [16, 29] as const,
  sidingPerSqft: [9, 18] as const,
  baseSquaresMinimum: 8,
  baseSquaresMaximum: 80,
  pitchMultipliers: {
    low: 1,
    medium: 1.08,
    steep: 1.16,
    verySteep: 1.28
  },
  complexityMultipliers: {
    simple: 1,
    moderate: 1.08,
    complex: 1.18
  },
  regionalSqftRanges: {
    NE: [1200, 2400],
    NW: [1400, 2800],
    SE: [1300, 2600],
    SW: [1500, 3200],
    default: [1300, 2600]
  }
} as const;

export type ComplexityBand = "simple" | "moderate" | "complex";

export function pitchBandFromDegrees(pitchDegrees: number) {
  if (pitchDegrees <= 22) return "low" as const;
  if (pitchDegrees <= 30) return "medium" as const;
  if (pitchDegrees <= 38) return "steep" as const;
  return "verySteep" as const;
}

export function complexityBandFromSegments(segmentCount: number): ComplexityBand {
  if (segmentCount <= 3) return "simple";
  if (segmentCount <= 6) return "moderate";
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

function rangeFromBase(rateRange: readonly [number, number], base: number, multiplier: number) {
  return {
    low: Math.round(base * rateRange[0] * multiplier),
    high: Math.round(base * rateRange[1] * multiplier)
  };
}

export function buildEstimateRanges(input: {
  roofAreaSqft: number;
  pitchDegrees: number;
  complexityBand: ComplexityBand;
}) {
  const roofSquares = roofSquaresFromSqft(input.roofAreaSqft);
  const pitchBand = pitchBandFromDegrees(input.pitchDegrees);
  const pitchMultiplier = pricingConfig.pitchMultipliers[pitchBand];
  const complexityMultiplier = pricingConfig.complexityMultipliers[input.complexityBand];
  const combinedMultiplier = pitchMultiplier * complexityMultiplier;

  const good = rangeFromBase(pricingConfig.roofPerSquareGood, roofSquares, combinedMultiplier);
  const better = rangeFromBase(pricingConfig.roofPerSquareBetter, roofSquares, combinedMultiplier);
  const best = rangeFromBase(pricingConfig.roofPerSquareBest, roofSquares, combinedMultiplier);

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
