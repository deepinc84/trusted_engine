import type { QuoteScope } from "@/lib/quote";

export type PublicQuoteDetailItem = {
  key: string;
  label: string;
  value: string;
  rawValue?: string | number | null;
};

export type PublicQuoteDisplay = {
  serviceType: "roofing" | "siding" | "eaves" | string;
  headline: string;
  supportingItems: PublicQuoteDetailItem[];
  dataSourceLabel?: string;
  methodologyLabel?: string;
};

type PublicQuoteDisplayInput = {
  selectedScope?: QuoteScope | string | null;
  serviceType?: string | null;
  requestedScopes?: string[] | null;
  material?: string | null;
  roofAreaSqft?: number | null;
  roofSquares?: number | null;
  pitchRatio?: string | null;
  pitchDegrees?: number | null;
  complexityBand?: string | null;
  dataSourceLabel?: string | null;
  dataSource?: string | null;
  sidingAreaSqft?: number | null;
  eavesLengthLf?: number | null;
  stories?: number | null;
  drainageLayout?: string | null;
  estimateBasis?: string | null;
};

function toFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toSentenceCase(value: string | null | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  if (!normalized) return null;
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function defaultDataSourceLabel(value: string | null | undefined) {
  const source = (value ?? "").toLowerCase();
  if (source.includes("google_solar") || source.includes("solar")) return "Trusted internal roof modeling";
  if (source.includes("regional")) return "Trusted regional intelligence model";
  return "Trusted internal pricing model";
}

function inferServiceType(input: PublicQuoteDisplayInput): "roofing" | "siding" | "eaves" {
  const scope = (input.selectedScope ?? "").toString().toLowerCase();
  const serviceType = (input.serviceType ?? "").toLowerCase();
  const material = (input.material ?? "").toLowerCase();
  const requested = (input.requestedScopes ?? []).map((value) => value.toLowerCase());

  if (scope.includes("eaves") || serviceType.includes("eaves") || requested.includes("eaves") || material.includes("eaves")) {
    return "eaves";
  }
  if (
    scope.includes("siding") ||
    serviceType.includes("siding") ||
    requested.includes("siding") ||
    material.includes("siding") ||
    material.includes("hardie") ||
    material.includes("vinyl")
  ) {
    return "siding";
  }
  return "roofing";
}

function formatSqft(value: number | null) {
  if (value === null) return null;
  return `${Math.round(value).toLocaleString()} sqft`;
}

function formatRoofSize(areaSqft: number | null, roofSquares: number | null) {
  if (areaSqft === null) return null;
  const squares = roofSquares ?? Math.round((areaSqft / 100) * 10) / 10;
  return `${Math.round(areaSqft).toLocaleString()} sqft (${squares.toLocaleString()} squares)`;
}

function formatPitch(pitchRatio: string | null | undefined, pitchDegrees: number | null | undefined) {
  if (pitchRatio && pitchRatio.trim().length > 0) return pitchRatio;
  if (typeof pitchDegrees !== "number" || !Number.isFinite(pitchDegrees)) return null;
  const rise = Math.max(0, Math.round(Math.tan((pitchDegrees * Math.PI) / 180) * 12));
  return `${rise}/12`;
}

function formatLinearFeet(value: number | null) {
  if (value === null) return null;
  return `${Math.round(value).toLocaleString()} linear ft`;
}

function deriveStories(value: number | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return `${Math.round(value)} storey`;
  }
  return "Standard residential profile";
}

function deriveWallAreaSqft(input: PublicQuoteDisplayInput) {
  const explicit = toFiniteNumber(input.sidingAreaSqft);
  if (explicit !== null) return explicit;
  const roofAreaSqft = toFiniteNumber(input.roofAreaSqft);
  if (roofAreaSqft === null) return null;
  const storeys = toFiniteNumber(input.stories);
  const multiplier = storeys === null
    ? 1.6
    : storeys >= 3
      ? 2.2
      : storeys <= 1
        ? 1.4
        : 1.8;
  return Math.round(roofAreaSqft * multiplier);
}

function deriveEavesLengthLf(input: PublicQuoteDisplayInput) {
  const explicit = toFiniteNumber(input.eavesLengthLf);
  if (explicit !== null) return explicit;
  const roofAreaSqft = toFiniteNumber(input.roofAreaSqft);
  if (roofAreaSqft !== null) {
    const approximateFootprintSqft = roofAreaSqft / 1.1;
    const approximatePerimeterLf = Math.sqrt(approximateFootprintSqft) * 4;
    return Math.round(approximatePerimeterLf * 1.1);
  }
  return null;
}

function buildRoofingItems(input: PublicQuoteDisplayInput): PublicQuoteDetailItem[] {
  const area = formatRoofSize(toFiniteNumber(input.roofAreaSqft), toFiniteNumber(input.roofSquares));
  const pitch = formatPitch(input.pitchRatio, toFiniteNumber(input.pitchDegrees));
  const complexity = toSentenceCase(input.complexityBand);
  const dataSourceLabel = "Trusted internal roof modeling";
  const items: PublicQuoteDetailItem[] = [];
  if (area) items.push({ key: "roof_size", label: "Roof size", value: area, rawValue: toFiniteNumber(input.roofAreaSqft) });
  if (pitch) items.push({ key: "pitch", label: "Pitch", value: pitch, rawValue: pitch });
  if (complexity) items.push({ key: "complexity", label: "Complexity", value: complexity, rawValue: input.complexityBand });
  if (dataSourceLabel) items.push({ key: "data_source", label: "Data source", value: dataSourceLabel, rawValue: dataSourceLabel });
  return items;
}

function buildSidingItems(input: PublicQuoteDisplayInput): PublicQuoteDetailItem[] {
  const wallArea = formatSqft(deriveWallAreaSqft(input));
  const homeHeight = deriveStories(toFiniteNumber(input.stories));
  const material = input.material?.trim();
  const complexity = toSentenceCase(input.complexityBand);
  const estimateBasis = input.estimateBasis?.trim() || "Based on property size and typical wall coverage";

  const items: PublicQuoteDetailItem[] = [];
  if (wallArea) items.push({ key: "estimated_wall_area", label: "Estimated wall area", value: wallArea, rawValue: deriveWallAreaSqft(input) });
  if (homeHeight) items.push({ key: "home_height", label: "Home height", value: homeHeight, rawValue: homeHeight });
  if (material) items.push({ key: "material", label: "Material", value: material, rawValue: material });
  if (complexity) items.push({ key: "complexity", label: "Complexity", value: complexity, rawValue: input.complexityBand });
  if (estimateBasis) items.push({ key: "estimate_basis", label: "Estimate basis", value: estimateBasis, rawValue: estimateBasis });
  return items;
}

function buildEavesItems(input: PublicQuoteDisplayInput): PublicQuoteDetailItem[] {
  const eavesLength = formatLinearFeet(deriveEavesLengthLf(input));
  const homeHeight = deriveStories(toFiniteNumber(input.stories));
  const rooflineComplexity = toSentenceCase(input.complexityBand);
  const drainageLayout = input.drainageLayout?.trim() || "Standard downspout layout";
  const estimateBasis = input.estimateBasis?.trim() || "Based on roofline and perimeter modeling";

  const items: PublicQuoteDetailItem[] = [];
  if (eavesLength) items.push({ key: "estimated_eaves_length", label: "Estimated eaves length", value: eavesLength, rawValue: deriveEavesLengthLf(input) });
  if (homeHeight) items.push({ key: "home_height", label: "Home height", value: homeHeight, rawValue: homeHeight });
  if (rooflineComplexity) items.push({ key: "roofline_complexity", label: "Roofline complexity", value: rooflineComplexity, rawValue: input.complexityBand });
  if (drainageLayout) items.push({ key: "drainage_layout", label: "Drainage layout", value: drainageLayout, rawValue: drainageLayout });
  if (estimateBasis) items.push({ key: "estimate_basis", label: "Estimate basis", value: estimateBasis, rawValue: estimateBasis });
  return items;
}

export function buildPublicQuoteDisplay(input: PublicQuoteDisplayInput): PublicQuoteDisplay {
  const serviceType = inferServiceType(input);
  const dataSourceLabel = input.dataSourceLabel ?? defaultDataSourceLabel(input.dataSource);
  const baseHeadline = serviceType === "siding"
    ? "Siding estimate details"
    : serviceType === "eaves"
      ? "Eavestrough estimate details"
      : "Roofing estimate details";

  const supportingItems = serviceType === "siding"
    ? buildSidingItems(input)
    : serviceType === "eaves"
      ? buildEavesItems(input)
      : buildRoofingItems(input);

  return {
    serviceType,
    headline: baseHeadline,
    supportingItems,
    dataSourceLabel,
    methodologyLabel: supportingItems.find((item) => item.key === "estimate_basis")?.value
  };
}

export function buildAdditionalPropertyFromDisplayItems(items: PublicQuoteDetailItem[]) {
  return items.map((item) => ({
    "@type": "PropertyValue",
    name: item.label,
    value: item.value
  }));
}

export function buildQuoteStructuredData(input: {
  pageUrl: string;
  serviceName: string;
  pageName: string;
  pageDescription: string;
  providerName: string;
  areaServed: string;
  estimateLow?: number | null;
  estimateHigh?: number | null;
  publicDisplay: PublicQuoteDisplay;
}) {
  const serviceId = `${input.pageUrl}#quoted-service`;
  const offerId = `${input.pageUrl}#estimate-offer`;
  const hasRange = typeof input.estimateLow === "number" && typeof input.estimateHigh === "number";

  const serviceEntity: Record<string, unknown> = {
    "@id": serviceId,
    "@type": "Service",
    name: input.serviceName,
    serviceType: input.publicDisplay.serviceType,
    areaServed: input.areaServed,
    provider: {
      "@type": "Organization",
      name: input.providerName
    },
    description: input.pageDescription,
    additionalProperty: buildAdditionalPropertyFromDisplayItems(input.publicDisplay.supportingItems)
  };

  const graph: Record<string, unknown>[] = [
    {
      "@id": `${input.pageUrl}#webpage`,
      "@type": "WebPage",
      name: input.pageName,
      description: input.pageDescription,
      url: input.pageUrl,
      mainEntity: { "@id": serviceId }
    },
    serviceEntity
  ];

  if (hasRange) {
    graph.push({
      "@id": offerId,
      "@type": "Offer",
      priceCurrency: "CAD",
      lowPrice: Math.round(input.estimateLow ?? 0),
      highPrice: Math.round(input.estimateHigh ?? 0),
      description: "Instant estimate range only. Final contract pricing is confirmed after on-site verification.",
      itemOffered: { "@id": serviceId }
    });
    serviceEntity.offers = { "@id": offerId };
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph
  };
}
