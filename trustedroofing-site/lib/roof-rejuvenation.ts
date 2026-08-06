export const ROOF_REJUVENATION_MINIMUM_CHARGE = 1595 as const;
export const ROOF_REJUVENATION_ROUNDING_INCREMENT = 25 as const;

export type RoofRejuvenationInput = {
  roofAreaSqft: number;
  pitchRatio?: string | null;
  pitchDegrees?: number | null;
};

export type RoofRejuvenationQuote = {
  roofAreaSqft: number;
  pitchRise: number;
  pitchRatio: string;
  ratePerSqft: number;
  minimumCharge: typeof ROOF_REJUVENATION_MINIMUM_CHARGE;
  rawPrice: number;
  price: number;
  minimumApplied: boolean;
  qualificationPending: true;
};

export function pitchRiseFromDegrees(pitchDegrees: number): number {
  if (!Number.isFinite(pitchDegrees) || pitchDegrees < 0 || pitchDegrees >= 90) {
    throw new RangeError("pitchDegrees must be between 0 and 90");
  }
  return Math.max(1, Math.min(13, Math.round(Math.tan((pitchDegrees * Math.PI) / 180) * 12)));
}

export function parsePitchRise(pitchRatio: string): number {
  const match = pitchRatio.trim().match(/^(\d+(?:\.\d+)?)\s*\/\s*12$/);
  if (!match) throw new TypeError("pitchRatio must use the X/12 format");
  const rise = Number(match[1]);
  if (!Number.isFinite(rise) || rise < 0) throw new RangeError("pitch rise must be non-negative");
  return Math.round(rise);
}

export function roofRejuvenationRateForPitch(pitchRise: number): number {
  if (!Number.isFinite(pitchRise) || pitchRise < 0) throw new RangeError("pitchRise must be non-negative");
  if (pitchRise <= 6) return 1;
  if (pitchRise <= 7) return 1.15;
  if (pitchRise <= 8) return 1.2;
  if (pitchRise <= 9) return 1.25;
  return 1.4;
}

export function calculateRoofRejuvenationQuote(input: RoofRejuvenationInput): RoofRejuvenationQuote {
  if (!Number.isFinite(input.roofAreaSqft) || input.roofAreaSqft <= 0) {
    throw new RangeError("roofAreaSqft must be greater than zero");
  }
  const pitchRise = input.pitchRatio?.trim()
    ? parsePitchRise(input.pitchRatio)
    : pitchRiseFromDegrees(input.pitchDegrees as number);
  const ratePerSqft = roofRejuvenationRateForPitch(pitchRise);
  const rawPrice = input.roofAreaSqft * ratePerSqft;
  const minimumApplied = rawPrice <= ROOF_REJUVENATION_MINIMUM_CHARGE;
  const price = minimumApplied
    ? ROOF_REJUVENATION_MINIMUM_CHARGE
    : Math.ceil(rawPrice / ROOF_REJUVENATION_ROUNDING_INCREMENT) * ROOF_REJUVENATION_ROUNDING_INCREMENT;

  return {
    roofAreaSqft: Math.round(input.roofAreaSqft),
    pitchRise,
    pitchRatio: `${pitchRise}/12`,
    ratePerSqft,
    minimumCharge: ROOF_REJUVENATION_MINIMUM_CHARGE,
    rawPrice,
    price,
    minimumApplied,
    qualificationPending: true
  };
}
