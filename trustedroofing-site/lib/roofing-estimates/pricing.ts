export const GST_RATE = 0.05;

export type Tier = "good" | "better" | "best";
export type ComponentKey = "fieldShingles" | "starterShingles" | "ridgeCaps" | "iceWater" | "underlayment" | "dripEdge" | "rakeEdge" | "valleyMetal" | "vents" | "goosenecks" | "plumbingBoots";

export type RoofingMeasurements = {
  roofAreaSqft: number; squares: number; pitch: string; complexity: "simple" | "moderate" | "complex";
  existingLayers: number; eaves: number; rakes: number; valleys: number; hips: number; ridges: number;
  wallTransitions: number; plumbingVents: number; goosenecks: number; staticVents: number; stories: number;
  deckingAllowance: number; accessDifficulty: "standard" | "restricted" | "difficult"; internalNotes: string;
};

export type SystemComponent = { label: string; unit: string; quantity: number; rate: number; coverage: number };
export type RoofingSystem = {
  tier: Tier; tierLabel: string; productName: string; components: Record<ComponentKey, SystemComponent>;
  wasteFactor: number; labourRatePerSquare: number; pitchAdjustment: number; heightAdjustment: number;
  complexityAdjustment: number; disposal: number; delivery: number; markupPercent: number;
  warrantyWording: string; customerSummary: string; requiresWorkbookMapping: true;
};
export type PriceBreakdown = { material: number; labour: number; disposal: number; delivery: number; adjustments: number; subtotal: number; markup: number; beforeTax: number; gst: number; total: number };
export type CalculatedOption = { system: RoofingSystem; breakdown: PriceBreakdown; calculatedPrice: number; finalPrice: number; override: null | { originalValue: number; newValue: number; reason: string; user: string; timestamp: string } };

const component = (label: string, unit: string): SystemComponent => ({ label, unit, quantity: 0, rate: 0, coverage: 1 });
function system(tier: Tier, tierLabel: string, productName: string, summary: string): RoofingSystem {
  return { tier, tierLabel, productName, components: {
    fieldShingles: component("Field shingles", "square"), starterShingles: component("Starter shingles", "linear foot"),
    ridgeCaps: component("Ridge caps", "linear foot"), iceWater: component("Ice-and-water membrane", "square foot"),
    underlayment: component("Synthetic underlayment", "square foot"), dripEdge: component("Drip edge", "linear foot"),
    rakeEdge: component("Rake edge", "linear foot"), valleyMetal: component("Valley metal", "linear foot"),
    vents: component("Static vents", "each"), goosenecks: component("Goosenecks", "each"), plumbingBoots: component("Plumbing boots", "each")
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

export function quantitiesFor(measurements: RoofingMeasurements, wasteFactor: number): Record<ComponentKey, number> {
  const area = measurements.roofAreaSqft || measurements.squares * 100;
  const squares = measurements.squares || area / 100;
  return { fieldShingles: squares * (1 + wasteFactor), starterShingles: measurements.eaves + measurements.rakes,
    ridgeCaps: measurements.hips + measurements.ridges, iceWater: measurements.eaves * 6 + measurements.valleys * 3,
    underlayment: area, dripEdge: measurements.eaves, rakeEdge: measurements.rakes, valleyMetal: measurements.valleys,
    vents: measurements.staticVents, goosenecks: measurements.goosenecks, plumbingBoots: measurements.plumbingVents };
}

export function calculateSystem(measurements: RoofingMeasurements, snapshot: RoofingSystem): CalculatedOption {
  const systemSnapshot = structuredClone(snapshot);
  const defaults = quantitiesFor(measurements, systemSnapshot.wasteFactor);
  let material = 0;
  for (const key of Object.keys(systemSnapshot.components) as ComponentKey[]) {
    const item = systemSnapshot.components[key];
    if (item.quantity <= 0) item.quantity = defaults[key];
    material += (item.quantity / Math.max(item.coverage, 0.0001)) * item.rate;
  }
  const squares = measurements.squares || measurements.roofAreaSqft / 100;
  const labour = squares * systemSnapshot.labourRatePerSquare;
  const adjustments = systemSnapshot.pitchAdjustment + systemSnapshot.heightAdjustment + systemSnapshot.complexityAdjustment;
  const subtotal = material + labour + systemSnapshot.disposal + systemSnapshot.delivery + adjustments;
  const markup = subtotal * systemSnapshot.markupPercent / 100;
  const beforeTax = subtotal + markup;
  const gst = beforeTax * GST_RATE;
  const total = beforeTax + gst;
  return { system: systemSnapshot, breakdown: { material, labour, disposal: systemSnapshot.disposal, delivery: systemSnapshot.delivery, adjustments, subtotal, markup, beforeTax, gst, total }, calculatedPrice: total, finalPrice: total, override: null };
}

export function applyManualOverride(option: CalculatedOption, newValue: number, reason: string, user: string, timestamp = new Date().toISOString()): CalculatedOption {
  if (!reason.trim()) throw new Error("A manual price override requires a reason.");
  return { ...option, finalPrice: newValue, override: { originalValue: option.calculatedPrice, newValue, reason: reason.trim(), user, timestamp } };
}
