import type { Project, ResolvedGeoPost, SolarSuitabilityAnalysis } from "./db";
import type { QuoteCardData } from "./seo-engine";

export type ServiceAreaNarrativeInput = {
  neighborhood: string;
  city: string;
  quadrant: string | null;
  quoteCount: number;
  projectCount: number;
  solarCount: number;
  geoPostCount: number;
  quotes: QuoteCardData[];
  projects: Project[];
  geoPosts: ResolvedGeoPost[];
  solarAnalyses: SolarSuitabilityAnalysis[];
  nearbyAreas: Array<{ neighborhood: string; slug: string }>;
};

export type ServiceAreaNarrative = {
  headline: string;
  summary: string;
  activityContext: string;
  roofContext: string | null;
  solarContext: string | null;
  nearbyContext: string | null;
};

function mostCommon(values: Array<string | null | undefined>) {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return (
    [...counts.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    )[0] ?? null
  );
}

function serviceLabel(value: string) {
  if (value.includes("siding")) return "siding";
  if (value.includes("gutter") || value.includes("eaves"))
    return "gutter and eavestrough";
  if (value.includes("repair")) return "roof repair";
  if (value.includes("solar")) return "solar-related exterior";
  return "roofing";
}

function formatArea(value: number) {
  return `${Math.round(value).toLocaleString()} sq. ft.`;
}

export function buildServiceAreaNarrative(
  input: ServiceAreaNarrativeInput,
): ServiceAreaNarrative {
  const serviceMix = [
    ...input.quotes.map((quote) => quote.material),
    ...input.projects.map((project) => serviceLabel(project.service_slug)),
    ...input.geoPosts.map((post) => serviceLabel(post.service_slug ?? "")),
  ];
  const topService = mostCommon(serviceMix)?.[0] ?? "roofing";
  const roofAreas = [
    ...input.quotes.map((quote) => quote.roofAreaSqft),
    ...input.solarAnalyses.map((solar) => solar.roof_area),
  ].filter(
    (value): value is number =>
      typeof value === "number" && Number.isFinite(value),
  );
  const pitches = [
    ...input.quotes.map((quote) => quote.pitchDegrees),
    ...input.solarAnalyses.map((solar) => solar.roof_pitch),
  ].filter(
    (value): value is number =>
      typeof value === "number" && Number.isFinite(value),
  );
  const complexCount = input.quotes.filter(
    (quote) => quote.complexityBand === "complex",
  ).length;
  const avgRoofArea = roofAreas.length
    ? roofAreas.reduce((sum, value) => sum + value, 0) / roofAreas.length
    : null;
  const avgPitch = pitches.length
    ? pitches.reduce((sum, value) => sum + value, 0) / pitches.length
    : null;
  const mixedExterior =
    new Set(serviceMix.map((value) => serviceLabel(value.toLowerCase()))).size >
    1;

  const sourceDescription =
    input.quoteCount > 0 && input.projectCount > 0
      ? "quote demand and completed project proof"
      : input.quoteCount > 0
        ? "instant quote demand"
        : input.projectCount > 0
          ? "published project activity"
          : "solar suitability activity";

  const summaryParts = [
    `${input.neighborhood} is represented in Trusted's local activity graph through ${sourceDescription}`,
  ];
  if (input.solarCount > 0)
    summaryParts.push(
      "with solar suitability modeling available as background roof-readiness context",
    );
  if (input.geoPostCount > 0)
    summaryParts.push(
      "and project-derived local project updates tied to completed work",
    );

  const activityContext =
    input.quoteCount > 0 && input.projectCount > 0
      ? `${input.neighborhood} combines ${input.quoteCount} recent quote signal${input.quoteCount === 1 ? "" : "s"} with ${input.projectCount} published project${input.projectCount === 1 ? "" : "s"}, so the page reflects both planning demand and real job history.`
      : input.quoteCount > 0
        ? `${input.neighborhood} is currently quote-led, with ${input.quoteCount} recent estimate signal${input.quoteCount === 1 ? "" : "s"} shaping the service-area context.`
        : input.projectCount > 0
          ? `${input.neighborhood} is currently project-led, with ${input.projectCount} published project${input.projectCount === 1 ? "" : "s"} anchoring this service-area page.`
          : `${input.neighborhood} is currently represented by solar suitability analysis data, which can inform roof-readiness planning without exposing private addresses.`;

  const roofContextParts: string[] = [];
  if (topService.toLowerCase().includes("siding"))
    roofContextParts.push(
      "Recent activity leans toward siding and exterior-envelope planning.",
    );
  else if (
    topService.toLowerCase().includes("gutter") ||
    topService.toLowerCase().includes("eaves")
  )
    roofContextParts.push(
      "Recent activity leans toward gutter and eavestrough drainage planning.",
    );
  else if (mixedExterior)
    roofContextParts.push(
      "Recent activity shows a mixed exterior scope rather than a single-service pattern.",
    );
  else roofContextParts.push("Recent activity is roofing-heavy.");

  if (avgRoofArea !== null && avgRoofArea >= 2400)
    roofContextParts.push(
      `Modeled roof areas trend large, averaging about ${formatArea(avgRoofArea)} across available signals.`,
    );
  else if (avgRoofArea !== null)
    roofContextParts.push(
      `Available model data includes roof sizes averaging about ${formatArea(avgRoofArea)}.`,
    );

  if (avgPitch !== null && avgPitch >= 35)
    roofContextParts.push(
      `Pitch data indicates steeper roof geometry, averaging about ${Math.round(avgPitch)} degrees where modeled.`,
    );
  else if (avgPitch !== null)
    roofContextParts.push(
      `Pitch data averages about ${Math.round(avgPitch)} degrees where modeled.`,
    );
  if (complexCount > 0)
    roofContextParts.push(
      `${complexCount} quote signal${complexCount === 1 ? "" : "s"} include complex roof characteristics.`,
    );

  const solarIntentCount = input.solarAnalyses.filter(
    (solar) => solar.solar_intent && solar.public_activity,
  ).length;
  const solarContext =
    input.solarCount > 0
      ? solarIntentCount > 0
        ? `${solarIntentCount} public solar-intent signal${solarIntentCount === 1 ? "" : "s"} exist for this area. Other solar modeling may be quote- or project-derived background enrichment.`
        : "Solar suitability modeling exists here as background enrichment for roof orientation, sun exposure, and future solar-readiness planning; it does not mean a homeowner requested solar or that Trusted installed solar."
      : null;

  return {
    headline: `${input.neighborhood} local activity summary`,
    summary: `${summaryParts.join(" ")}.`,
    activityContext,
    roofContext: roofContextParts.length ? roofContextParts.join(" ") : null,
    solarContext,
    nearbyContext: input.nearbyAreas.length
      ? `Related active areas include ${input.nearbyAreas.map((area) => area.neighborhood).join(", ")}.`
      : null,
  };
}
