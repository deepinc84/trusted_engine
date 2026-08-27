import { PRICING_POLICY as P } from "./pricing-policy";
import type { PricingComponent, PricingRequest, PricingResult } from "./service-types";

const money = (n: number) => Math.round(n * 100) / 100;
export function pitchBand(pitch?: number) {
  if (pitch == null) return "unknown";
  if (pitch <= 6) return "0-6/12";
  if (pitch <= 8) return ">6-8/12";
  if (pitch <= 12) return ">8-12/12";
  return ">12/12";
}
function pitchMultiplier(pitch?: number) { return pitch == null || pitch <= 6 ? 1 : pitch <= 8 ? 1.25 : pitch <= 12 ? 1.5 : null; }
function component(code: string, label: string, low: number, high = low, flags: Partial<PricingComponent> = {}): PricingComponent {
  return { code, label, low, high, emergencyEligible: true, pitchEligible: false, accessEligible: false, ...flags };
}

export function calculatePricing(request: PricingRequest): PricingResult {
  const components: PricingComponent[] = [], assumptions: string[] = [], warnings: string[] = [];
  let manualReviewRequired = false;
  const qty = Math.max(1, Math.floor(request.quantity ?? 1));
  const lf = Math.max(0, request.linearFeet ?? 0);
  if (request.rule === "attendance") components.push(component("visit", "Technician visit", P.visit));
  else if (request.rule === "inspection" || request.rule === "roof_inspection") {
    let total: number = P.inspection;
    if (request.rule === "roof_inspection") {
      if (request.pitch == null) { manualReviewRequired = true; warnings.push("Roof pitch is required for authoritative roof inspection pricing."); }
      else if (request.pitch > 12) { manualReviewRequired = true; warnings.push("Pitch above 12/12 requires special review."); }
      else total = request.pitch <= 6 ? P.roofInspections.low : request.pitch <= 8 ? P.roofInspections.steep : P.roofInspections.verySteep;
    }
    components.push(component("inspection", "Inspection", total));
  } else if (request.rule === "eavestrough") {
    const extra = Math.max(0, lf - P.eavestrough.includedLf);
    components.push(component("eavestrough", "Eavestrough project", P.eavestrough.minimum + extra * P.eavestrough.excessLow, P.eavestrough.minimum + extra * P.eavestrough.excessHigh, { includedVisitFee: true, accessEligible: true }));
  } else {
    if (!request.visitAlreadyIncluded) components.push(component("visit", "Technician visit", P.visit));
    let low = 0, high = 0, pitchEligible = false;
    if (request.rule === "unlisted") low = high = (request.estimatedTechHours ?? 0) * P.hourlyLabour;
    if (request.rule === "siding_piece") low = high = qty <= 3 ? P.sidingPieces[qty as 1|2|3] : qty * P.sidingPieces.additionalUnit;
    if (request.rule === "roof_vent") { low = high = qty * (qty === 1 ? 150 : qty === 2 ? 125 : qty === 3 ? 100 : 75); pitchEligible = true; }
    if (request.rule === "shingle_bundle") { low = high = qty * (qty === 1 ? 450 : qty === 2 ? 375 : 300); pitchEligible = true; }
    if (request.rule === "gutter_guard") low = high = lf * P.gutterGuardPerLf;
    if (request.rule === "downspout") low = high = lf * P.downspoutPerLf;
    if (request.rule === "custom_roof_repair") { low = request.baseWorkLow ?? 0; high = request.baseWorkHigh ?? low; pitchEligible = true; }
    if (request.rule === "minor_sealant") { low = P.sealant.low; high = P.sealant.high; }
    components.push(component("work", "Service work", low, high, { pitchEligible, accessEligible: true }));
    if (request.materialAcquisitionRequired) components.push(component("material_acquisition", "Material acquisition time", P.hourlyLabour, P.hourlyLabour, { accessEligible: false, pitchEligible: false }));
  }
  const pm = pitchMultiplier(request.pitch);
  if (request.pitch != null && request.pitch > 12 && components.some(c => c.pitchEligible)) { manualReviewRequired = true; warnings.push("Roof work above 12/12 requires special review."); }
  const am = P.accessMultipliers[request.accessClass ?? "normal"];
  const emergency = request.urgency === "emergency" ? P.emergencyMultiplier : 1;
  for (const c of components) {
    const safety = (c.pitchEligible ? (pm ?? 1) : 1) * (c.accessEligible ? am : 1);
    c.low = money(c.low * safety * (c.emergencyEligible ? emergency : 1));
    c.high = money(c.high * safety * (c.emergencyEligible ? emergency : 1));
  }
  if (request.boomRequired) components.push(component("boom", "Boom/lift allowance", P.boom.low, P.boom.high, { emergencyEligible: false }));
  return { low: money(components.reduce((s,c)=>s+c.low,0)), high: money(components.reduce((s,c)=>s+c.high,0)), components, assumptions, warnings, manualReviewRequired, estimatedTechHours: request.estimatedTechHours, pricingModelVersion: P.version };
}
