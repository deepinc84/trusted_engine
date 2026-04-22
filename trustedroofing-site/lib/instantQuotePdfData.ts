import { listProjects, listRecentInstaquoteAddressQueries, type InstaquoteAddressQuery } from "@/lib/db";
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

export type SolarLeadGenData = {
  enabled: boolean;
  heading: string;
  intro: string;
  suitabilityLine: string;
  teaserLabel: string;
  teaserTitle: string;
  teaserBody: string;
  teaserSupport: string;
  teaserNextPage: string;
  facts: string[];
  benefits: string[];
  nextSteps: string[];
  ctaLabel: string;
  ctaUrl: string;
};

type ServiceFamily = "roofing" | "siding" | "eavestrough" | "soffit_fascia";

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
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

function rowMatchesService(row: InstaquoteAddressQuery, family: ServiceFamily) {
  const material = quoteMaterialLabel(row.service_type, row.requested_scopes).toLowerCase();
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
    .filter((row) => rowMatchesService(row, family))
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
  const unique = [...preferred, ...fallback]
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

  return unique;
}

export function getSolarLeadGenData(input: {
  address?: string;
  serviceType?: string;
  roofArea?: number;
  roofPitch?: number;
  roofPlanes?: number;
  solarData?: Record<string, unknown> | null;
}): SolarLeadGenData {
  const facts: string[] = [];
  if (typeof input.roofArea === "number" && Number.isFinite(input.roofArea)) {
    facts.push(`Modeled roof area: ~${Math.round(input.roofArea).toLocaleString()} sq ft`);
  }
  if (typeof input.roofPitch === "number" && Number.isFinite(input.roofPitch)) {
    facts.push(`Modeled roof pitch: ~${Math.round(input.roofPitch)}°`);
  }
  if (typeof input.roofPlanes === "number" && Number.isFinite(input.roofPlanes)) {
    facts.push(`Roof planes noted: ${Math.max(1, Math.round(input.roofPlanes))}`);
  }
  if (facts.length === 0) {
    facts.push("Property geometry can be reviewed for usable roof area and sun exposure.");
  }

  return {
    enabled: true,
    heading: "A quick look at solar potential",
    intro: "Solar is not included in this estimate. This page is an experimental planning insight only.",
    suitabilityLine: "If roof layout and sun exposure are suitable, solar may be worth a closer review as a future upgrade.",
    teaserLabel: "Experimental planning feature",
    teaserTitle: "Curious about solar potential?",
    teaserBody: "If your property has the right roof exposure and usable roof area, solar may be worth exploring as part of a future upgrade plan.",
    teaserSupport: "This is a test feature and not part of your current quoted scope.",
    teaserNextPage: "See page 4 for a quick solar potential overview.",
    facts,
    benefits: [
      "Can help offset part of household electrical usage.",
      "May add long-term value depending on roof layout and consumption profile.",
      "Works best when paired with a roof that still has good remaining life.",
      "Can be worth reviewing during larger exterior planning."
    ],
    nextSteps: [
      "Review roof suitability",
      "Confirm usable roof area and constraints",
      "Prepare a more accurate solar review"
    ],
    ctaLabel: "Explore solar potential at trustedroofingcalgary.com/solar",
    ctaUrl: canonicalUrl("/solar")
  };
}
