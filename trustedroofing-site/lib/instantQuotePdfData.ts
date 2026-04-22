import { listProjects, listRecentInstaquoteAddressQueries } from "@/lib/db";
import { canonicalUrl } from "@/lib/seo";
import { quoteMaterialLabel, resolvePublicLocation } from "@/lib/serviceAreas";

export type ServiceSpecificQuoteSignal = {
  serviceType: string;
  geographyLevel: "neighborhood" | "quadrant" | "city";
  geographyLabel: string;
  quoteSignalCount: number;
  rangeMin: number | null;
  rangeMax: number | null;
  heading: string;
  subtext: string;
};

export type RelatedProjectCard = {
  title: string;
  summary: string;
  imageUrl: string;
  href: string;
  locationLabel: string;
  serviceBadge: string;
  ctaLabel: string;
};

export type SolarChartDatum = {
  label: string;
  value: number;
  normalized: number;
  emphasis?: boolean;
};

export type SolarSnapshotData = {
  hasSolarData: boolean;
  hasFinancialData: boolean;
  maxPanels: number | null;
  maxArrayAreaM2: number | null;
  maxSunHoursYear: number | null;
  imageryQuality: string | null;
  imageryDate: string | null;
  imageryProcessedDate: string | null;
  roofSegmentSummary: Array<{ label: string; areaM2: number | null; sunshine: number | null }>;
  panelConfigSummary: Array<{ label: string; panelCount: number; yearlyKwh: number | null }>;
  chartType: "panel_config" | "roof_segment" | "readiness";
  chartData: SolarChartDatum[];
  interpretation: string;
  disclaimer: string;
  sourceNote: string;
  hasStrongData: boolean;
  teaserTitle: string;
  teaserBody: string;
  teaserNextPage: string;
  benefits: string[];
  ctaLabel: string;
  ctaUrl: string;
};

type ServiceFamily = "roofing" | "siding" | "eavestrough" | "soffit_fascia";

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function toTitle(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatIsoDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function clampSummary(value: string, maxLength = 180) {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

function serviceFamilyFromScope(scope: string): ServiceFamily {
  if (scope === "vinyl_siding" || scope === "hardie_siding") return "siding";
  if (scope === "eavestrough") return "eavestrough";
  return "roofing";
}

function serviceLabelForFamily(family: ServiceFamily, scope: string) {
  if (family === "siding") return scope === "hardie_siding" ? "Hardie siding" : "Siding";
  if (family === "eavestrough") return "Eavestrough";
  if (family === "soffit_fascia") return "Soffit & fascia";
  return "Roofing";
}

function rowMatchesService(serviceType: string | null, requestedScopes: string[] | null, family: ServiceFamily) {
  const material = quoteMaterialLabel(serviceType, requestedScopes).toLowerCase();
  if (family === "roofing") return material.includes("roofing");
  if (family === "siding") return material.includes("siding");
  if (family === "eavestrough") return material.includes("eaves");
  if (family === "soffit_fascia") return material.includes("soffit") || material.includes("fascia");
  return false;
}

function projectServiceSlugForFamily(family: ServiceFamily) {
  if (family === "siding") return "siding";
  if (family === "eavestrough") return "gutters";
  return "roofing";
}

export async function getServiceSpecificQuoteSignals(input: {
  address?: string;
  city?: string | null;
  quadrant?: string | null;
  neighborhood?: string | null;
  serviceType: string;
}): Promise<ServiceSpecificQuoteSignal | null> {
  const rows = await listRecentInstaquoteAddressQueries(1200);
  const family = serviceFamilyFromScope(input.serviceType);
  const serviceLabel = serviceLabelForFamily(family, input.serviceType);
  const location = resolvePublicLocation({
    address: input.address,
    city: input.city,
    quadrant: input.quadrant,
    neighborhood: input.neighborhood
  });

  const filtered = rows
    .filter((row) => row.estimate_low !== null && row.estimate_high !== null)
    .filter((row) => rowMatchesService(row.service_type, row.requested_scopes, family))
    .map((row) => ({ row, location: resolvePublicLocation({ address: row.address, neighborhood: row.neighborhood }) }))
    .sort((a, b) => new Date(b.row.queried_at).getTime() - new Date(a.row.queried_at).getTime());

  const byNeighborhood = filtered.filter((item) =>
    location.kind === "neighborhood"
    && normalize(item.location.locality) === normalize(location.locality)
    && normalize(item.location.city) === normalize(location.city)
  );

  const byQuadrant = filtered.filter((item) =>
    !!location.quadrant
    && normalize(item.location.city) === normalize(location.city)
    && normalize(item.location.quadrant) === normalize(location.quadrant)
  );

  const byCity = filtered.filter((item) => normalize(item.location.city) === normalize(location.city));

  const match = byNeighborhood.length > 0
    ? { level: "neighborhood" as const, cards: byNeighborhood, label: location.locality }
    : byQuadrant.length > 0
      ? { level: "quadrant" as const, cards: byQuadrant, label: `${location.quadrant} ${location.city}` }
      : byCity.length > 0
        ? { level: "city" as const, cards: byCity, label: location.city }
        : null;

  if (!match) return null;

  const recent = match.cards.slice(0, 24);
  const lows = recent.flatMap((item) => typeof item.row.estimate_low === "number" ? [item.row.estimate_low] : []);
  const highs = recent.flatMap((item) => typeof item.row.estimate_high === "number" ? [item.row.estimate_high] : []);

  return {
    serviceType: serviceLabel,
    geographyLevel: match.level,
    geographyLabel: match.label,
    quoteSignalCount: recent.length,
    rangeMin: lows.length > 0 ? Math.round(Math.min(...lows)) : null,
    rangeMax: highs.length > 0 ? Math.round(Math.max(...highs)) : null,
    heading: "Recent quote activity for similar scope",
    subtext: `We've recently published ${serviceLabel.toLowerCase()} quote signals in your area.`
  };
}

export async function getRelatedProjects(input: {
  serviceType: string;
  city?: string | null;
  quadrant?: string | null;
  neighborhood?: string | null;
  address?: string | null;
  limit?: number;
}) {
  const family = serviceFamilyFromScope(input.serviceType);
  const serviceSlug = projectServiceSlugForFamily(family);
  const serviceBadge = serviceLabelForFamily(family, input.serviceType);
  const limit = Math.max(1, Math.min(input.limit ?? 3, 3));

  const preferred = await listProjects({ service_slug: serviceSlug, include_unpublished: false, limit: 40 });
  const fallback = await listProjects({ include_unpublished: false, limit: 80 });

  const normalizedAddress = normalize(input.address);
  return [...preferred, ...fallback]
    .filter((project, index, list) => list.findIndex((candidate) => candidate.id === project.id) === index)
    .filter((project) => project.is_published)
    .filter((project) => (project.photos?.[0]?.public_url ?? "").length > 0)
    .filter((project) => normalize(project.address_private) !== normalizedAddress)
    .filter((project) => {
      if (family === "roofing") return project.service_slug === "roofing" || project.service_slug === "roof-repair";
      if (family === "siding") return project.service_slug === "siding";
      if (family === "eavestrough") return project.service_slug === "gutters";
      return true;
    })
    .map((project) => {
      const sameCity = normalize(project.city) === normalize(input.city);
      const sameQuadrant = !!input.quadrant && normalize(project.quadrant) === normalize(input.quadrant);
      const sameNeighborhood = !!input.neighborhood && normalize(project.neighborhood) === normalize(input.neighborhood);
      const completedScore = project.completed_at ? 1 : 0;
      const score = (sameNeighborhood ? 100 : 0) + (sameQuadrant ? 40 : 0) + (sameCity ? 20 : 0) + completedScore;
      return { project, score };
    })
    .sort((a, b) => b.score - a.score || new Date(b.project.completed_at ?? b.project.created_at).getTime() - new Date(a.project.completed_at ?? a.project.created_at).getTime())
    .slice(0, limit)
    .map(({ project }, index) => ({
      title: project.title,
      summary: clampSummary(project.summary || "Explore a recent related exterior project."),
      imageUrl: project.photos?.[0]?.public_url ?? "",
      href: canonicalUrl(`/projects/${project.slug}`),
      locationLabel: [project.neighborhood, project.quadrant, project.city].filter(Boolean).join(" · "),
      serviceBadge,
      ctaLabel: index % 2 === 0 ? "See similar project" : "Explore this project"
    })) satisfies RelatedProjectCard[];
}

export function getSolarSnapshotData(input: {
  buildingInsights?: Record<string, unknown> | null;
  dataLayers?: Record<string, unknown> | null;
  quoteContext?: { serviceType?: string | null };
  propertyContext?: { roofAreaSqft?: number | null };
}): SolarSnapshotData {
  const building = (input.buildingInsights ?? {}) as Record<string, unknown>;
  const solarPotential = (building.solarPotential ?? {}) as Record<string, unknown>;
  const wholeRoofStats = (solarPotential.wholeRoofStats ?? {}) as Record<string, unknown>;

  const maxPanels = typeof solarPotential.maxArrayPanelsCount === "number" ? Math.round(solarPotential.maxArrayPanelsCount) : null;
  const maxArrayAreaM2 = typeof solarPotential.maxArrayAreaMeters2 === "number"
    ? solarPotential.maxArrayAreaMeters2
    : typeof wholeRoofStats.areaMeters2 === "number"
      ? wholeRoofStats.areaMeters2
      : null;
  const maxSunHoursYear = typeof solarPotential.maxSunshineHoursPerYear === "number" ? solarPotential.maxSunshineHoursPerYear : null;

  const imageryQualityRaw = typeof building.imageryQuality === "string" ? building.imageryQuality : null;
  const imageryQuality = imageryQualityRaw ? toTitle(imageryQualityRaw) : null;
  const imageryDate = formatIsoDate(typeof building.imageryDate === "string" ? building.imageryDate : null);
  const imageryProcessedDate = formatIsoDate(typeof building.imageryProcessedDate === "string" ? building.imageryProcessedDate : null);

  const panelConfigs = Array.isArray(solarPotential.solarPanelConfigs)
    ? solarPotential.solarPanelConfigs as Array<Record<string, unknown>>
    : [];

  const panelConfigSummary = panelConfigs
    .map((config, index) => ({
      label: `Config ${index + 1}`,
      panelCount: typeof config.panelsCount === "number" ? Math.round(config.panelsCount) : 0,
      yearlyKwh: typeof config.yearlyEnergyDcKwh === "number" ? config.yearlyEnergyDcKwh : null
    }))
    .filter((row) => row.panelCount > 0)
    .sort((a, b) => a.panelCount - b.panelCount)
    .slice(-5);

  const roofSegments = Array.isArray(solarPotential.roofSegmentStats)
    ? solarPotential.roofSegmentStats as Array<Record<string, unknown>>
    : [];

  const roofSegmentSummary = roofSegments
    .map((segment, index) => {
      const stats = (segment.stats ?? {}) as Record<string, unknown>;
      return {
        label: `Segment ${index + 1}`,
        areaM2: typeof stats.areaMeters2 === "number" ? stats.areaMeters2 : null,
        sunshine: typeof stats.sunshineQuantiles === "number"
          ? stats.sunshineQuantiles
          : typeof segment.azimuthDegrees === "number"
            ? 180 - Math.abs(180 - Math.min(360, Math.max(0, Number(segment.azimuthDegrees))))
            : null
      };
    })
    .filter((row) => row.areaM2 !== null)
    .slice(0, 6);

  const financialAnalyses = Array.isArray(solarPotential.financialAnalyses)
    ? solarPotential.financialAnalyses
    : Array.isArray(building.financialAnalyses)
      ? building.financialAnalyses
      : [];

  const hasSolarData = [maxPanels, maxArrayAreaM2, maxSunHoursYear].some((value) => typeof value === "number");
  const hasStrongData = hasSolarData || panelConfigSummary.length > 0 || roofSegmentSummary.length > 0;

  const chartFromPanelConfig: SolarChartDatum[] = panelConfigSummary.map((row) => ({
    label: `${row.panelCount}p`,
    value: row.yearlyKwh ?? row.panelCount,
    normalized: 0,
    emphasis: row.panelCount === Math.max(...panelConfigSummary.map((item) => item.panelCount))
  }));

  const chartFromSegments: SolarChartDatum[] = roofSegmentSummary.map((row) => ({
    label: row.label.replace("Segment ", "S"),
    value: row.areaM2 ?? 0,
    normalized: 0,
    emphasis: false
  }));

  const readinessBase = [
    { label: "Panels", value: maxPanels ?? 0 },
    { label: "Array area", value: maxArrayAreaM2 ?? 0 },
    { label: "Sun hours", value: maxSunHoursYear ?? 0 }
  ];
  const readinessMax = Math.max(...readinessBase.map((item) => item.value), 1);
  const readinessChart: SolarChartDatum[] = readinessBase.map((item) => ({
    label: item.label,
    value: item.value,
    normalized: item.value / readinessMax,
    emphasis: item.label === "Sun hours"
  }));

  let chartType: SolarSnapshotData["chartType"] = "readiness";
  let chartData = readinessChart;
  if (chartFromPanelConfig.length >= 2) {
    chartType = "panel_config";
    chartData = chartFromPanelConfig;
  } else if (chartFromSegments.length >= 2) {
    chartType = "roof_segment";
    chartData = chartFromSegments;
  }

  const maxChartValue = Math.max(...chartData.map((item) => item.value), 1);
  chartData = chartData.map((item) => ({
    ...item,
    normalized: item.normalized > 0 ? item.normalized : item.value / maxChartValue
  }));

  const interpretationParts: string[] = [];
  if (typeof maxArrayAreaM2 === "number") {
    interpretationParts.push(`Modeled usable array area is about ${maxArrayAreaM2.toFixed(1)} m²`);
  }
  if (typeof maxPanels === "number") {
    interpretationParts.push(`with capacity for up to ${maxPanels} panels`);
  }
  if (typeof maxSunHoursYear === "number") {
    interpretationParts.push(`and roughly ${Math.round(maxSunHoursYear).toLocaleString()} annual sun-hours`);
  }
  const interpretation = interpretationParts.length > 0
    ? `${interpretationParts.join(" ")}. This suggests the property is worth a focused solar suitability review before any final system recommendation.`
    : "Solar API detail is limited for this address, but modeled roof and sun inputs still suggest a solar suitability review could be worthwhile.";

  const teaserTitle = hasStrongData ? "Solar potential snapshot available" : "Solar planning snapshot";
  const teaserBody = hasStrongData
    ? "This property returned modeled solar capacity data during estimate generation."
    : "Solar suitability data was limited in this run, but roof and sun exposure can still be reviewed.";

  return {
    hasSolarData,
    hasFinancialData: financialAnalyses.length > 0,
    maxPanels,
    maxArrayAreaM2,
    maxSunHoursYear,
    imageryQuality,
    imageryDate,
    imageryProcessedDate,
    roofSegmentSummary,
    panelConfigSummary,
    chartType,
    chartData,
    interpretation,
    disclaimer: "This solar snapshot is an early planning aid and not part of the quoted scope.",
    sourceNote: "Modeled from Google Solar API rooftop analysis",
    hasStrongData,
    teaserTitle,
    teaserBody,
    teaserNextPage: "See page 4 for a quick planning view based on roof and sun exposure metrics.",
    benefits: [
      "May offset a portion of household electricity use.",
      "Easier to evaluate while planning major exterior work.",
      "Best reviewed alongside roof age, usable planes, and electrical goals."
    ],
    ctaLabel: "Explore solar potential",
    ctaUrl: canonicalUrl("/solar")
  };
}
