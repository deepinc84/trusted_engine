export const GST_RATE = 0.05;

export type Tier = "good" | "better" | "best";
export type ComponentKey = "fieldShingles" | "starterShingles" | "ridgeCaps" | "iceWater" | "underlayment" | "dripEdge" | "rakeEdge" | "valleyMetal" | "vents" | "goosenecks" | "plumbingBoots";

export type RoofingMeasurements = {
  roofAreaSqft: number; squares: number; pitch: string; complexity: "simple" | "moderate" | "complex";
  existingLayers: number; eaves: number; rakes: number; valleys: number; hips: number; ridges: number;
  wallTransitions: number; plumbingVents: number; goosenecks: number; staticVents: number; stories: number;
  deckingAllowance: number; accessDifficulty: "standard" | "restricted" | "difficult"; internalNotes: string;
};

export type SystemComponent = { label: string; unit: string; quantity: number; rate: number; coverage: number; catalogueItemId?: string; coverageUnit?: string|null; supplier?:string|null;currency?:string;quoteRequired?:boolean;sourceReference?:string|null;catalogVersionId?:string;catalogVersionName?:string };
export type RoofingSystem = {
  tier: Tier; tierLabel: string; productName: string; components: Record<ComponentKey, SystemComponent>;
  wasteFactor: number; labourRatePerSquare: number; pitchAdjustment: number; heightAdjustment: number;
  complexityAdjustment: number; disposal: number; delivery: number; markupPercent: number;
  warrantyWording: string; customerSummary: string; requiresWorkbookMapping: boolean;
  materialTraces?: Record<string,{extension:number|null;productionReady:boolean}>; rateTraces?: Array<{rateItemId:string;trade:string;rateType:string;name:string;rate:number;unit:string;sourceReference:string|null;appliedQuantity:number;extension:number}>; pricingWarnings?: string[]; productionReady?: boolean;
  pricingStrategy?: {type:"fixed_profit"|"cost_plus_percentage"|"target_margin"|"strategic_price";value:number};
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
  const squares = measurements.squares || measurements.roofAreaSqft / 100;
  for (const key of Object.keys(systemSnapshot.components) as ComponentKey[]) {
    const item = systemSnapshot.components[key];
    if(item.catalogueItemId){const required=key==="fieldShingles"?squares:defaults[key],waste=["fieldShingles","starterShingles","ridgeCaps"].includes(key)?systemSnapshot.wasteFactor:0,after=required*(1+waste),bundle=/bundles?\s*(per|\/)\s*square/i.test(item.coverageUnit??"");const raw=item.coverage>0?(bundle?required*item.coverage*(1+waste):after/item.coverage):null;const units=raw===null?null:Math.max(required>0?1:0,Math.ceil(raw));item.quantity=units??0;if(systemSnapshot.materialTraces?.[key])systemSnapshot.materialTraces[key]={...systemSnapshot.materialTraces[key],requiredQuantity:required,requiredAfterWaste:after,rawCalculatedUnits:raw,orderQuantity:units,extension:units===null?null:units*item.rate} as any;if(units!==null)material+=units*item.rate;continue}
    if (item.quantity <= 0) item.quantity = defaults[key];
    material += Math.ceil(item.quantity / Math.max(item.coverage, 0.0001)) * item.rate;
  }
  const rateTraces=systemSnapshot.rateTraces?.map((item:any)=>{const unit=String(item.unit??"").toLowerCase();const quantity=unit.includes("square foot")?measurements.roofAreaSqft:unit.includes("linear")?measurements.eaves+measurements.rakes+measurements.valleys+measurements.hips+measurements.ridges:unit.includes("square")?squares:item.appliedQuantity||1;return{...item,appliedQuantity:quantity,extension:item.rate*quantity}});if(rateTraces)systemSnapshot.rateTraces=rateTraces;const labour = rateTraces?.reduce((sum,item)=>sum+item.extension,0)??squares * systemSnapshot.labourRatePerSquare;
  const adjustments = systemSnapshot.pitchAdjustment + systemSnapshot.heightAdjustment + systemSnapshot.complexityAdjustment;
  const subtotal = material + labour + systemSnapshot.disposal + systemSnapshot.delivery + adjustments;
  const strategy=systemSnapshot.pricingStrategy??{type:"fixed_profit" as const,value:100};
  let beforeTax=subtotal+100;if(strategy.type==="cost_plus_percentage")beforeTax=subtotal*(1+strategy.value/100);else if(strategy.type==="target_margin")beforeTax=strategy.value>=100?subtotal:subtotal/(1-strategy.value/100);else if(strategy.type==="strategic_price")beforeTax=strategy.value;else beforeTax=subtotal+strategy.value;
  const markup = beforeTax-subtotal;
  const gst = beforeTax * GST_RATE;
  const total = beforeTax + gst;
  return { system: systemSnapshot, breakdown: { material, labour, disposal: systemSnapshot.disposal, delivery: systemSnapshot.delivery, adjustments, subtotal, markup, beforeTax, gst, total }, calculatedPrice: total, finalPrice: total, override: null };
}

export function applyManualOverride(option: CalculatedOption, newValue: number, reason: string, user: string, timestamp = new Date().toISOString()): CalculatedOption {
  if (!reason.trim()) throw new Error("A manual price override requires a reason.");
  return { ...option, finalPrice: newValue, override: { originalValue: option.calculatedPrice, newValue, reason: reason.trim(), user, timestamp } };
}
