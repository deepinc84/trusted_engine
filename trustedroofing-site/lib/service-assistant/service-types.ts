export type AccessClass = "normal" | "elevated" | "difficult" | "severe";
export type Urgency = "routine" | "priority" | "emergency";
export type PitchSource = "google_solar" | "customer_reported" | "customer_description" | "unknown";
export type AiProvider = "cloudflare_ai" | "rules_fallback";

export type PricingComponent = {
  code: string; label: string; low: number; high: number;
  emergencyEligible: boolean; pitchEligible: boolean; accessEligible: boolean;
  includedVisitFee?: boolean;
};

export type PricingResult = {
  low: number; high: number; components: PricingComponent[];
  assumptions: string[]; warnings: string[]; manualReviewRequired: boolean;
  estimatedTechHours?: number; actualTechHours?: number;
  historicalComparableCount?: number; pricingModelVersion: string;
};

export type PricingRequest = {
  rule: "attendance" | "unlisted" | "inspection" | "roof_inspection" | "siding_piece" | "roof_vent" | "shingle_bundle" | "eavestrough" | "gutter_guard" | "downspout" | "custom_roof_repair" | "minor_sealant";
  quantity?: number; linearFeet?: number; estimatedTechHours?: number; pitch?: number;
  accessClass?: AccessClass; urgency?: Urgency; boomRequired?: boolean;
  baseWorkLow?: number; baseWorkHigh?: number; visitAlreadyIncluded?: boolean;
  materialAcquisitionRequired?: boolean;
};

export type ServiceState = {
  sessionId: string; service?: string; intent?: string; material?: string; cause?: string;
  problem?: string; inspectionRequired: boolean; address?: string; neighbourhood?: string;
  city?: string; province?: string; postalCode?: string; quadrant?: string; lat?: number; lng?: number;
  roofRelated: boolean; pitch?: number; pitchSource: PitchSource; pitchBand?: string;
  storeys?: number; workingHeightFt?: number; accessClass: AccessClass; accessMultiplier: number;
  boomRequired: boolean; urgency: Urgency; emergencyReasons: string[]; quantity?: number;
  estimatedTechHours?: number; pricingRule?: PricingRequest["rule"]; replacementEstimateRequested?: boolean; pricingComponents: PricingComponent[];
  calculatedLow?: number; calculatedHigh?: number; aiProvider: AiProvider; confidence: number;
  estimates: Array<{ type: string; low: number; high: number; createdAt: string }>;
};
