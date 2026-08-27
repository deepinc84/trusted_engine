import type { AccessClass } from "./service-types";

export const PRICING_POLICY = Object.freeze({
  version: "service-assistant-v1",
  visit: 295,
  hourlyLabour: 145,
  inspection: 395,
  roofInspections: { low: 395, steep: 495, verySteep: 645 },
  pitchMultipliers: { low: 1, steep: 1.25, verySteep: 1.5 },
  accessMultipliers: { normal: 1, elevated: 1.2, difficult: 1.3, severe: 1.4 } satisfies Record<AccessClass, number>,
  emergencyMultiplier: 2.25,
  boom: { low: 1000, high: 1500 },
  sealant: { low: 50, high: 250 },
  sidingPieces: { 1: 175, 2: 250, 3: 300, additionalUnit: 100 },
  roofVentsEach: { 1: 150, 2: 125, 3: 100, fourPlus: 75 },
  shingleBundlesEach: { 1: 450, 2: 375, threePlus: 300 },
  eavestrough: { minimum: 1150, includedLf: 100, excessLow: 9.25, excessHigh: 9.5 },
  gutterGuardPerLf: 12,
  downspoutPerLf: 10,
  materialAcquisitionTechHours: 1,
  baselineHours: { fascia_resecure: [1, 2], soffit_repair: [1.5, 3], minor_flashing_adjustment: [1, 2], miscellaneous_exterior_repair: [1, 3] }
});
