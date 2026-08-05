export const GST_RATE = 0.05;

export type Tier = "good" | "better" | "best";
export type ComponentKey = "fieldShingles" | "starterShingles" | "ridgeCaps" | "iceWater" | "underlayment" | "dripEdge" | "rakeEdge" | "valleyMetal" | "vents" | "goosenecks" | "plumbingBoots";
export type StructureInclusionStatus = "included" | "optional" | "alternative" | "excluded" | "by_others" | "internal_only";
export type AreaEntryType = "actual_roof_area" | "horizontal_plan_area";
export type QuantitySource = "roof_squares" | "pitch_area_squares" | "roof_area_sqft" | "eaves_lf" | "rakes_lf" | "valleys_lf" | "hips_lf" | "ridges_lf" | "hips_and_ridges_lf" | "wall_transitions_lf" | "plumbing_vent_count" | "gooseneck_count" | "static_vent_count" | "additional_layers" | "additional_stories" | "explicit_lump_sum";
export type RateClassification = "base_installation_labour" | "pitch_labour" | "pitch_surcharge" | "tear_off_labour" | "additional_layer_labour" | "eaves_labour" | "rake_labour" | "ridge_labour" | "hip_labour" | "valley_labour" | "wall_flashing_labour" | "plumbing_boot_labour" | "gooseneck_labour" | "delivery" | "disposal" | "equipment" | "mobilization" | "site_control" | "project_management" | "travel" | "hotel" | "custom";
export type PitchInput = { rise: number; run: number; ratio: string; degrees: number; multiplier: number };
export type PitchAreaRow = { id: string; pitch: PitchInput; squareFootage: number; areaEntryType: AreaEntryType; wasteOverride?: number | null; note?: string; includeStatus: "included" | "excluded"; displayOrder: number };
export type RoofStructure = {
  id: string; label: string; inclusionStatus: StructureInclusionStatus; displayOrder: number; internalNotes?: string;
  pitchAreas: PitchAreaRow[];
  measurements: { eaves: number; rakes: number; valleys: number; hips: number; ridges: number; wallTransitions: number; stepFlashing: number; headwallFlashing: number; sidewallFlashing: number; chimneyPerimeter: number; skylightPerimeter: number; customFlashing: number; existingLayers: number; stories: number; complexity: "simple" | "moderate" | "complex"; accessDifficulty: "standard" | "restricted" | "difficult"; deckingAllowance: number; internalNotes: string };
  penetrations: { plumbingVents: number; goosenecks: number; bathroomExhausts: number; dryerExhausts: number; rangeExhausts: number; skylights: number; chimneys: number; roofHatches: number; solarPenetrations: number; satelliteMounts: number; customPenetrations: number };
  ventilation?: { atticFloorAreaSqft: number; ratio: 150 | 300 | number; existingIntakeNfva: number; existingExhaustNfva: number; eligibleRidgeLength: number; intakeNfvaPerUnit?: number; exhaustNfvaPerUnit?: number; exhaustNfvaPerLinearFoot?: number; manualOverrideQuantity?: number; manualOverrideReason?: string } | null;
};
export type StructureTotals = { structureId: string; label: string; inclusionStatus: StructureInclusionStatus; totalEnteredArea: number; totalActualRoofArea: number; areaByPitch: Record<string, number>; totalSquares: number; wasteAdjustedArea: number; labourQuantityByPitch: Record<string, number>; warnings: string[]; ventilation?: VentilationResult };
export type VentilationResult = { requiredTotalNfva: number; requiredIntakeNfva: number; requiredExhaustNfva: number; proposedIntakeNfva: number; proposedExhaustNfva: number; exhaustQuantity: number | null; ridgeVentLength: number | null; warnings: string[] };
export type ExplicitRateRule = { classification: RateClassification; quantitySource: QuantitySource; required?: boolean; selected?: boolean; pitchRiseMin?: number; pitchRiseMax?: number; additive?: boolean; explicitQuantity?: number | null; applicabilityReason?: string };

export type RoofingMeasurements = {
  roofAreaSqft: number; squares: number; pitch: string; complexity: "simple" | "moderate" | "complex";
  existingLayers: number; eaves: number; rakes: number; valleys: number; hips: number; ridges: number;
  wallTransitions: number; plumbingVents: number; goosenecks: number; staticVents: number; stories: number;
  deckingAllowance: number; accessDifficulty: "standard" | "restricted" | "difficult"; internalNotes: string;
  structures?: RoofStructure[];
};

export type SystemComponent = { label: string; unit: string; quantity: number; rate: number; coverage: number; wasteFactor?:number; catalogueItemId?: string; coverageUnit?: string|null; supplier?:string|null;currency?:string;quoteRequired?:boolean;sourceReference?:string|null;catalogVersionId?:string;catalogVersionName?:string; quantitySource?: QuantitySource };
export type RoofingSystem = {
  tier: Tier; tierLabel: string; productName: string; components: Record<ComponentKey, SystemComponent>;
  wasteFactor: number; labourRatePerSquare: number; pitchAdjustment: number; heightAdjustment: number;
  complexityAdjustment: number; disposal: number; delivery: number; markupPercent: number;
  warrantyWording: string; customerSummary: string; requiresWorkbookMapping: boolean;
  materialTraces?: Record<string,{extension:number|null;productionReady:boolean}>; rateTraces?: Array<{rateItemId:string;trade:string;rateType:string;name:string;rate:number;unit:string;sourceReference:string|null;appliedQuantity:number;extension:number;classification?:RateClassification;quantitySource?:QuantitySource;rule?:ExplicitRateRule;applicabilityReason?:string}>; pricingWarnings?: string[]; productionReady?: boolean;
  pricingStrategy?: {type:"fixed_profit"|"cost_plus_percentage"|"target_margin"|"strategic_price";value:number};
  explicitRateRules?: Record<string, ExplicitRateRule>;
  ventType?: "pro50" | "pro75" | "vmax303" | "vmax301" | "ridge";
};
export type PriceBreakdown = { material: number; labour: number; disposal: number; delivery: number; adjustments: number; subtotal: number; markup: number; beforeTax: number; gst: number; total: number };
export type PricingAudit = { materialRows: any[]; rateRows: any[]; structureTotals: StructureTotals[]; warnings: string[]; preventedRates: string[] };
export type CalculatedOption = { system: RoofingSystem; breakdown: PriceBreakdown; calculatedPrice: number; finalPrice: number; override: null | { originalValue: number; newValue: number; reason: string; user: string; timestamp: string }; structureTotals?: StructureTotals[]; pricingAudit?: PricingAudit };

const round = (n: number, places = 2) => Math.round((n + Number.EPSILON) * 10 ** places) / 10 ** places;
const component = (label: string, unit: string, quantitySource?: QuantitySource): SystemComponent => ({ label, unit, quantity: 0, rate: 0, coverage: 1, quantitySource });
function system(tier: Tier, tierLabel: string, productName: string, summary: string): RoofingSystem {
  return { tier, tierLabel, productName, components: {
    fieldShingles: component("Field shingles", "square", "roof_squares"), starterShingles: component("Starter shingles", "linear foot", "eaves_lf"),
    ridgeCaps: component("Ridge caps", "linear foot", "hips_and_ridges_lf"), iceWater: component("Ice-and-water membrane", "square foot", "roof_area_sqft"),
    underlayment: component("Synthetic underlayment", "square foot", "roof_area_sqft"), dripEdge: component("Drip edge", "linear foot", "eaves_lf"),
    rakeEdge: component("Rake edge", "linear foot", "rakes_lf"), valleyMetal: component("Valley metal", "linear foot", "valleys_lf"),
    vents: component("Static vents", "each", "static_vent_count"), goosenecks: component("Goosenecks", "each", "gooseneck_count"), plumbingBoots: component("Plumbing boots", "each", "plumbing_vent_count")
  }, wasteFactor: 0.1, labourRatePerSquare: 0, pitchAdjustment: 0, heightAdjustment: 0, complexityAdjustment: 0,
  disposal: 0, delivery: 0, markupPercent: 0, warrantyWording: "Warranty wording requires estimator review.",
  customerSummary: summary, requiresWorkbookMapping: true };
}

/** Zero-valued intentionally: map the approved Mega workbook before production pricing. */
export const DEFAULT_ROOFING_SYSTEMS: RoofingSystem[] = [
  system("good", "Good", "GAF Timberline HDZ", "A complete, dependable architectural roofing system."),
  system("better", "Better", "Malarkey Vista", "A higher-performance roofing system with upgraded shingles."),
  system("best", "Best", "Malarkey Legacy", "Our premium roofing system for maximum performance and protection.")
];

export function normalizeStructureLabel(label?: string | null) { return label?.trim() || "Main Structure"; }
export function parsePitch(input: string | PitchInput): PitchInput {
  if (typeof input !== "string") return input;
  const degreesMatch = input.match(/([0-9.]+)\s*deg/i);
  const slashMatch = input.match(/([0-9.]+)\s*\/\s*([0-9.]+)/);
  const run = slashMatch ? Number(slashMatch[2]) : 12;
  const rise = degreesMatch ? Math.tan(Number(degreesMatch[1]) * Math.PI / 180) * run : slashMatch ? Number(slashMatch[1]) : Number(input) || 4;
  const degrees = Math.atan(rise / run) * 180 / Math.PI;
  return { rise, run, ratio: `${round(rise)}/${round(run)}`, degrees: round(degrees), multiplier: round(Math.sqrt(rise * rise + run * run) / run, 4) };
}
function legacyMeasurements(m: RoofingMeasurements): RoofStructure["measurements"] {
  return { eaves: m.eaves, rakes: m.rakes, valleys: m.valleys, hips: m.hips, ridges: m.ridges, wallTransitions: m.wallTransitions, stepFlashing: 0, headwallFlashing: m.wallTransitions, sidewallFlashing: 0, chimneyPerimeter: 0, skylightPerimeter: 0, customFlashing: 0, existingLayers: m.existingLayers || 1, stories: m.stories || 1, complexity: m.complexity, accessDifficulty: m.accessDifficulty, deckingAllowance: m.deckingAllowance, internalNotes: m.internalNotes };
}
function legacyPenetrations(m: RoofingMeasurements): RoofStructure["penetrations"] {
  return { plumbingVents: m.plumbingVents, goosenecks: m.goosenecks, bathroomExhausts: m.staticVents, dryerExhausts: 0, rangeExhausts: 0, skylights: 0, chimneys: 0, roofHatches: 0, solarPenetrations: 0, satelliteMounts: 0, customPenetrations: 0 };
}
export function legacyStructureFromMeasurements(m: RoofingMeasurements): RoofStructure {
  const area = m.roofAreaSqft || m.squares * 100;
  return { id: "legacy-main-structure", label: "Main Structure", inclusionStatus: "included", displayOrder: 0, internalNotes: "Legacy roofing measurements were imported into Main Structure. Review pitch areas, rate selections and ventilation before sending.", pitchAreas: [{ id: "legacy-main-pitch", pitch: parsePitch(m.pitch), squareFootage: area, areaEntryType: "actual_roof_area", includeStatus: "included", displayOrder: 0 }], measurements: legacyMeasurements(m), penetrations: legacyPenetrations(m), ventilation: { atticFloorAreaSqft: area, ratio: 300, existingIntakeNfva: 0, existingExhaustNfva: 0, eligibleRidgeLength: 0 } };
}
export function normalizeRoofStructures(m: RoofingMeasurements): RoofStructure[] {
  const base = m.structures?.length ? m.structures : [legacyStructureFromMeasurements(m)];
  return base.map((s, i) => ({ ...s, label: normalizeStructureLabel(s.label), displayOrder: s.displayOrder ?? i, measurements: { ...legacyMeasurements(m), ...s.measurements }, penetrations: { ...legacyPenetrations(m), ...s.penetrations }, pitchAreas: s.pitchAreas.map((r, ri) => ({ ...r, pitch: parsePitch(r.pitch), squareFootage: Number(r.squareFootage) || 0, areaEntryType: r.areaEntryType ?? "actual_roof_area", includeStatus: r.includeStatus ?? "included", displayOrder: r.displayOrder ?? ri })) })).sort((a, b) => a.displayOrder - b.displayOrder);
}
function actualArea(row: PitchAreaRow) { return row.includeStatus === "excluded" ? 0 : row.areaEntryType === "horizontal_plan_area" ? row.squareFootage * row.pitch.multiplier : row.squareFootage; }
export function calculateVentilation(v?: RoofStructure["ventilation"]): VentilationResult | undefined {
  if (!v || !v.atticFloorAreaSqft || !v.ratio) return undefined;
  const requiredTotalNfva = v.atticFloorAreaSqft / v.ratio * 144, requiredIntakeNfva = requiredTotalNfva / 2, requiredExhaustNfva = requiredTotalNfva / 2;
  const warnings: string[] = [];
  let proposedIntakeNfva = v.existingIntakeNfva || 0, proposedExhaustNfva = v.existingExhaustNfva || 0, exhaustQuantity: number | null = null, ridgeVentLength: number | null = null;
  if (v.intakeNfvaPerUnit && v.intakeNfvaPerUnit > 0) proposedIntakeNfva += Math.ceil(Math.max(requiredIntakeNfva - proposedIntakeNfva, 0) / v.intakeNfvaPerUnit) * v.intakeNfvaPerUnit; else warnings.push("Missing intake data.");
  if (v.exhaustNfvaPerLinearFoot && v.exhaustNfvaPerLinearFoot > 0) { ridgeVentLength = round(Math.max(requiredExhaustNfva - proposedExhaustNfva, 0) / v.exhaustNfvaPerLinearFoot); if (v.eligibleRidgeLength && ridgeVentLength > v.eligibleRidgeLength) warnings.push("Eligible ridge length is insufficient."); proposedExhaustNfva += Math.min(ridgeVentLength, v.eligibleRidgeLength || ridgeVentLength) * v.exhaustNfvaPerLinearFoot; }
  else if (v.exhaustNfvaPerUnit && v.exhaustNfvaPerUnit > 0) { exhaustQuantity = v.manualOverrideQuantity ?? Math.ceil(Math.max(requiredExhaustNfva - proposedExhaustNfva, 0) / v.exhaustNfvaPerUnit); proposedExhaustNfva += exhaustQuantity * v.exhaustNfvaPerUnit; }
  else warnings.push("Missing exhaust data.");
  if (proposedIntakeNfva < requiredIntakeNfva) warnings.push("Insufficient intake ventilation.");
  if (proposedExhaustNfva < requiredExhaustNfva) warnings.push("Insufficient exhaust ventilation.");
  return { requiredTotalNfva: round(requiredTotalNfva), requiredIntakeNfva: round(requiredIntakeNfva), requiredExhaustNfva: round(requiredExhaustNfva), proposedIntakeNfva: round(proposedIntakeNfva), proposedExhaustNfva: round(proposedExhaustNfva), exhaustQuantity, ridgeVentLength, warnings };
}
function totalsForStructure(s: RoofStructure, wasteFactor: number): StructureTotals {
  const areaByPitch: Record<string, number> = {}; let entered = 0, actual = 0, wasteAdjustedArea = 0;
  for (const row of s.pitchAreas) { if (row.includeStatus === "excluded") continue; const rowActual = actualArea(row); entered += row.squareFootage; actual += rowActual; wasteAdjustedArea += rowActual * (1 + (row.wasteOverride ?? wasteFactor)); areaByPitch[row.pitch.ratio] = round((areaByPitch[row.pitch.ratio] ?? 0) + rowActual); }
  const ventilation = calculateVentilation(s.ventilation);
  return { structureId: s.id, label: s.label, inclusionStatus: s.inclusionStatus, totalEnteredArea: round(entered), totalActualRoofArea: round(actual), areaByPitch, totalSquares: round(actual / 100), wasteAdjustedArea: round(wasteAdjustedArea), labourQuantityByPitch: Object.fromEntries(Object.entries(areaByPitch).map(([pitch, area]) => [pitch, round(area / 100)])), warnings: [...(s.internalNotes?.includes("Legacy roofing measurements") ? [s.internalNotes] : []), ...(ventilation?.warnings ?? [])], ventilation };
}
function ventQuantityForStructures(structures: RoofStructure[], totals: StructureTotals[], ventType: RoofingSystem["ventType"] = "pro50") {
  if (ventType === "ridge") return structures.reduce((sum, s) => sum + s.measurements.ridges, 0);
  const coverage = ventType === "pro75" ? 300 : ventType === "vmax303" ? 800 : ventType === "vmax301" ? 1200 : 200;
  const area = structures.reduce((sum, s) => sum + (totals.find(t => t.structureId === s.id)?.totalActualRoofArea ?? 0), 0);
  return area > 0 ? Math.ceil(area / coverage) : 0;
}
function quantityFromSource(source: QuantitySource, s: RoofStructure, totals: StructureTotals, row?: PitchAreaRow, explicit?: number | null): number {
  if (source === "pitch_area_squares") return row ? round(actualArea(row) / 100) : 0;
  if (source === "roof_squares") return totals.totalSquares;
  if (source === "roof_area_sqft") return totals.totalActualRoofArea;
  if (source === "eaves_lf") return s.measurements.eaves;
  if (source === "rakes_lf") return s.measurements.rakes;
  if (source === "valleys_lf") return s.measurements.valleys;
  if (source === "hips_lf") return s.measurements.hips;
  if (source === "ridges_lf") return s.measurements.ridges;
  if (source === "hips_and_ridges_lf") return s.measurements.hips + s.measurements.ridges;
  if (source === "wall_transitions_lf") return s.measurements.wallTransitions;
  if (source === "plumbing_vent_count") return s.penetrations.plumbingVents;
  if (source === "gooseneck_count") return s.penetrations.goosenecks;
  if (source === "static_vent_count") return s.penetrations.bathroomExhausts + s.penetrations.dryerExhausts + s.penetrations.rangeExhausts;
  if (source === "additional_layers") return Math.max(s.measurements.existingLayers - 1, 0);
  if (source === "additional_stories") return Math.max(s.measurements.stories - 1, 0);
  if (source === "explicit_lump_sum") return explicit ?? 0;
  return 0;
}
function inferRateRule(item: NonNullable<RoofingSystem["rateTraces"]>[number]): ExplicitRateRule | null {
  const name = `${item.rateType} ${item.name}`.toLowerCase(), unit = item.unit.toLowerCase();
  if (/hotel|travel|delivery|project management|mobilization|site control|equipment/.test(name)) return null;
  if (/additional.*layer|extra.*layer/.test(name)) return { classification: "additional_layer_labour", quantitySource: "additional_layers", required: true, applicabilityReason: "additional existing layers" };
  if (/valley/.test(name)) return { classification: "valley_labour", quantitySource: "valleys_lf", required: true, applicabilityReason: "valley footage" };
  if (/ridge/.test(name)) return { classification: "ridge_labour", quantitySource: "ridges_lf", required: true, applicabilityReason: "ridge footage" };
  if (/wall|flashing/.test(name)) return { classification: "wall_flashing_labour", quantitySource: "wall_transitions_lf", required: true, applicabilityReason: "wall flashing footage" };
  if (/gooseneck/.test(name)) return { classification: "gooseneck_labour", quantitySource: "gooseneck_count", required: true, applicabilityReason: "gooseneck count" };
  if (/plumbing|boot/.test(name)) return { classification: "plumbing_boot_labour", quantitySource: "plumbing_vent_count", required: true, applicabilityReason: "plumbing vent count" };
  if (/stor(e|y|ies)/.test(name)) return { classification: "custom", quantitySource: "additional_stories", required: true, applicabilityReason: "additional stories" };
  const pitch = name.match(/(\d{1,2})\s*\/\s*12|(\d{1,2})\s*pitch/);
  if (pitch && unit.includes("square")) { const rise = Number(pitch[1] ?? pitch[2]); return { classification: "pitch_labour", quantitySource: "pitch_area_squares", required: true, pitchRiseMin: rise, pitchRiseMax: rise, applicabilityReason: `${rise}/12 pitch area` }; }
  if (/base|install|labou?r/.test(name) && unit.includes("square")) return { classification: "base_installation_labour", quantitySource: "pitch_area_squares", required: true, pitchRiseMin: 0, pitchRiseMax: 20, applicabilityReason: "base installation labour" };
  return null;
}
function rateAppliesToRow(rule: ExplicitRateRule, row: PitchAreaRow) { return rule.pitchRiseMin === undefined || (row.pitch.rise >= rule.pitchRiseMin && row.pitch.rise <= (rule.pitchRiseMax ?? rule.pitchRiseMin)); }
function rateRows(systemSnapshot: RoofingSystem, structures: RoofStructure[], totals: StructureTotals[]) {
  const rows: NonNullable<RoofingSystem["rateTraces"]> = [], preventedRates: string[] = [];
  const rules = systemSnapshot.explicitRateRules ?? {};
  const hasPitchSpecific = (systemSnapshot.rateTraces ?? []).some(r => (rules[r.rateItemId] ?? r.rule ?? inferRateRule(r))?.classification === "pitch_labour");
  for (const rate of systemSnapshot.rateTraces ?? []) {
    const rule = rules[rate.rateItemId] ?? rate.rule ?? inferRateRule(rate);
    if (!rule || (!rule.required && !rule.selected)) { preventedRates.push(rate.name); continue; }
    if (rule.classification === "base_installation_labour" && hasPitchSpecific && !rule.selected) { preventedRates.push(`${rate.name} (conflicting base labour)`); continue; }
    for (const s of structures) {
      const structureTotals = totals.find(t => t.structureId === s.id)!;
      if (rule.quantitySource === "pitch_area_squares") for (const row of s.pitchAreas) {
        if (row.includeStatus === "excluded" || !rateAppliesToRow(rule, row)) continue;
        const appliedQuantity = quantityFromSource(rule.quantitySource, s, structureTotals, row, rule.explicitQuantity);
        if (appliedQuantity > 0) rows.push({ ...rate, classification: rule.classification, quantitySource: rule.quantitySource, appliedQuantity, extension: round(appliedQuantity * rate.rate), applicabilityReason: rule.applicabilityReason });
      } else {
        const appliedQuantity = quantityFromSource(rule.quantitySource, s, structureTotals, undefined, rule.explicitQuantity);
        if (appliedQuantity > 0) rows.push({ ...rate, classification: rule.classification, quantitySource: rule.quantitySource, appliedQuantity, extension: round(appliedQuantity * rate.rate), applicabilityReason: rule.applicabilityReason });
      }
    }
  }
  return { rows, preventedRates };
}

export function quantitiesFor(measurements: RoofingMeasurements, wasteFactor: number): Record<ComponentKey, number> {
  const structures = normalizeRoofStructures(measurements).filter(s => s.inclusionStatus === "included");
  return structures.reduce((sum, s) => {
    const t = totalsForStructure(s, wasteFactor);
    sum.fieldShingles += t.totalSquares * (1 + wasteFactor); sum.starterShingles += s.measurements.eaves + s.measurements.rakes;
    sum.ridgeCaps += s.measurements.hips + s.measurements.ridges; sum.iceWater += s.measurements.eaves * 6 + s.measurements.valleys * 3;
    sum.underlayment += t.totalActualRoofArea; sum.dripEdge += s.measurements.eaves; sum.rakeEdge += s.measurements.rakes; sum.valleyMetal += s.measurements.valleys;
    sum.vents += s.penetrations.bathroomExhausts + s.penetrations.dryerExhausts + s.penetrations.rangeExhausts; sum.goosenecks += s.penetrations.goosenecks; sum.plumbingBoots += s.penetrations.plumbingVents;
    return sum;
  }, { fieldShingles: 0, starterShingles: 0, ridgeCaps: 0, iceWater: 0, underlayment: 0, dripEdge: 0, rakeEdge: 0, valleyMetal: 0, vents: 0, goosenecks: 0, plumbingBoots: 0 });
}

export function calculateSystem(measurements: RoofingMeasurements, snapshot: RoofingSystem): CalculatedOption {
  const systemSnapshot = structuredClone(snapshot);
  const structures = normalizeRoofStructures(measurements);
  const baseStructures = structures.filter(s => s.inclusionStatus === "included");
  const structureTotals = structures.map(s => totalsForStructure(s, systemSnapshot.wasteFactor));
  const defaults = quantitiesFor(measurements, systemSnapshot.wasteFactor);
  let material = 0;
  const squares = baseStructures.reduce((sum, s) => sum + (structureTotals.find(t => t.structureId === s.id)?.totalSquares ?? 0), 0);
  const materialRows: any[] = [];
  for (const key of Object.keys(systemSnapshot.components) as ComponentKey[]) {
    const item = systemSnapshot.components[key];
    if(item.catalogueItemId){const required=key==="fieldShingles"?squares:key==="vents"&&systemSnapshot.ventType?ventQuantityForStructures(baseStructures,structureTotals,systemSnapshot.ventType):defaults[key],waste=item.wasteFactor??(["fieldShingles","starterShingles","ridgeCaps"].includes(key)?systemSnapshot.wasteFactor:0),after=required*(1+waste),bundle=/bundles?\s*(per|\/)\s*square/i.test(item.coverageUnit??"");const raw=item.coverage>0?(bundle?required*item.coverage*(1+waste):after/item.coverage):null;const units=raw===null?null:Math.max(required>0?1:0,Math.ceil(raw));item.quantity=units??0;const extension=units===null?null:units*item.rate;materialRows.push({component:key,catalogueItemId:item.catalogueItemId,product:item.label,priceUnit:item.unit,coverage:item.coverage,coverageUnit:item.coverageUnit,quantitySource:key==="vents"&&systemSnapshot.ventType?`vent_type_${systemSnapshot.ventType}`:item.quantitySource??"component_rule",measuredRequirement:required,waste,adjustedRequirement:after,rawUnits:raw,roundedUnits:units,unitPrice:item.rate,extension,warning:item.coverage<=0?"Missing or invalid coverage.":undefined});if(systemSnapshot.materialTraces?.[key])systemSnapshot.materialTraces[key]={...systemSnapshot.materialTraces[key],requiredQuantity:required,requiredAfterWaste:after,rawCalculatedUnits:raw,orderQuantity:units,extension} as any;if(units!==null)material+=units*item.rate;continue}
    if (item.quantity <= 0) item.quantity = key==="vents"&&systemSnapshot.ventType?ventQuantityForStructures(baseStructures,structureTotals,systemSnapshot.ventType):defaults[key];
    const units = item.coverage > 0 ? Math.ceil(item.quantity / item.coverage) : null;
    const extension = units === null ? null : units * item.rate;
    materialRows.push({component:key,product:item.label,priceUnit:item.unit,coverage:item.coverage,quantitySource:item.quantitySource??"component_rule",measuredRequirement:item.quantity,waste:0,adjustedRequirement:item.quantity,rawUnits:units,roundedUnits:units,unitPrice:item.rate,extension,warning:item.coverage<=0?"Missing or invalid coverage.":undefined});
    if (extension !== null) material += extension;
  }
  const rateResult = rateRows(systemSnapshot, baseStructures, structureTotals);
  if (systemSnapshot.rateTraces) systemSnapshot.rateTraces = rateResult.rows;
  const labour = rateResult.rows.length ? rateResult.rows.reduce((sum,item)=>sum+item.extension,0) : squares * systemSnapshot.labourRatePerSquare;
  const adjustments = systemSnapshot.pitchAdjustment + systemSnapshot.heightAdjustment + systemSnapshot.complexityAdjustment;
  const subtotal = material + labour + systemSnapshot.disposal + systemSnapshot.delivery + adjustments;
  const strategy=systemSnapshot.pricingStrategy??{type:"fixed_profit" as const,value:100};
  let beforeTax=subtotal+100;if(strategy.type==="cost_plus_percentage")beforeTax=subtotal*(1+strategy.value/100);else if(strategy.type==="target_margin")beforeTax=strategy.value>=100?subtotal:subtotal/(1-strategy.value/100);else if(strategy.type==="strategic_price")beforeTax=strategy.value;else beforeTax=subtotal+strategy.value;
  const markup = beforeTax-subtotal;
  const gst = beforeTax * GST_RATE;
  const total = beforeTax + gst;
  const breakdown = { material: round(material), labour: round(labour), disposal: systemSnapshot.disposal, delivery: systemSnapshot.delivery, adjustments, subtotal: round(subtotal), markup: round(markup), beforeTax: round(beforeTax), gst: round(gst), total: round(total) };
  return { system: systemSnapshot, breakdown, calculatedPrice: breakdown.total, finalPrice: breakdown.total, override: null, structureTotals, pricingAudit: { materialRows, rateRows: rateResult.rows, structureTotals, warnings: [...structureTotals.flatMap(t=>t.warnings), ...materialRows.filter(r=>r.warning).map(r=>`${r.component}: ${r.warning}`)], preventedRates: rateResult.preventedRates } };
}

export function applyManualOverride(option: CalculatedOption, newValue: number, reason: string, user: string, timestamp = new Date().toISOString()): CalculatedOption {
  if (!reason.trim()) throw new Error("A manual price override requires a reason.");
  return { ...option, finalPrice: newValue, override: { originalValue: option.calculatedPrice, newValue, reason: reason.trim(), user, timestamp } };
}
