import type { Project, InstaquoteAddressQuery } from "./db";
import { listProjects, listRecentInstaquoteAddressQueries } from "./db";
import { haversineKm } from "./geo";
import {
  buildQuoteAnchorSlug,
  buildQuoteSignalTitle,
  neighborhoodSlug,
  quoteComplexityLabel,
  quoteMaterialLabel,
  resolvePublicLocation
} from "./serviceAreas";

export type QuoteCardData = {
  id: string;
  locality: string;
  neighborhood: string;
  slug: string;
  city: string;
  locationLabel: string;
  cityQuadrantLabel: string;
  locationKind: "neighborhood" | "quadrant" | "city";
  quadrant: string | null;
  complexity: string;
  material: string;
  estimateLow: number | null;
  estimateHigh: number | null;
  roofAreaSqft: number | null;
  pitchDegrees: number | null;
  queriedAt: string;
  title: string;
  description: string;
};

export type QuoteNeighborhoodSummary = {
  neighborhood: string;
  slug: string;
  city: string;
  quadrant: string | null;
  quoteCount: number;
  averageLow: number | null;
  averageHigh: number | null;
  centroidLat: number | null;
  centroidLng: number | null;
  cards: QuoteCardData[];
};

export type QuoteAggregateSummary = {
  key: string;
  title: string;
  city: string;
  quadrant: string | null;
  quoteCount: number;
  averageLow: number | null;
  averageHigh: number | null;
};

export type QuoteArchiveAggregates = {
  cities: QuoteAggregateSummary[];
  cityQuadrants: QuoteAggregateSummary[];
  neighborhoods: QuoteAggregateSummary[];
};

export type QuoteArchiveMaterialSection = {
  material: string;
  cards: QuoteCardData[];
  aggregates: QuoteArchiveAggregates;
};

export type QuadrantHeat = Record<"NW" | "NE" | "SW" | "SE", number>;

export type ProjectNeighborhoodSummary = {
  neighborhood: string;
  slug: string;
  city: string;
  quadrant: string | null;
  projectCount: number;
};

function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function averageFloat(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function toQuoteCard(row: InstaquoteAddressQuery): QuoteCardData {
  const location = resolvePublicLocation({
    neighborhood: row.neighborhood,
    address: row.address
  });
  const material = quoteMaterialLabel(row.service_type, row.requested_scopes);
  const complexity = quoteComplexityLabel(row.complexity_band);
  const estimateLow = typeof row.estimate_low === "number" ? row.estimate_low : null;
  const estimateHigh = typeof row.estimate_high === "number" ? row.estimate_high : null;

  return {
    id: row.id,
    locality: location.locality,
    neighborhood: location.locality,
    slug: buildQuoteAnchorSlug(material, location.locality, location.city, String(row.id)),
    city: location.city,
    locationLabel: location.label,
    cityQuadrantLabel: location.cityQuadrantLabel,
    locationKind: location.kind,
    quadrant: location.quadrant,
    complexity,
    material,
    estimateLow,
    estimateHigh,
    roofAreaSqft: typeof row.roof_area_sqft === "number" ? row.roof_area_sqft : null,
    pitchDegrees: typeof row.pitch_degrees === "number" ? row.pitch_degrees : null,
    queriedAt: row.queried_at,
    title: buildQuoteSignalTitle(material, location.locality, location.city),
    description: `Recent address-level ${material.toLowerCase()} estimate generated for this area. Modeled estimate signal based on recent local property inputs.`
  };
}

async function getAllQuoteCardsInternal() {
  const rows = await listRecentInstaquoteAddressQueries(1200);
  return rows
    .map(toQuoteCard)
    .filter((card) => card.city.length > 0)
    .sort((a, b) => new Date(b.queriedAt).getTime() - new Date(a.queriedAt).getTime());
}

async function buildNeighborhoodSummaries() {
  const rows = await listRecentInstaquoteAddressQueries(1200);
  const grouped = new Map<string, {
    neighborhood: string;
    city: string;
    quadrant: string | null;
    lows: number[];
    highs: number[];
    lats: number[];
    lngs: number[];
    cards: QuoteCardData[];
  }>();

  for (const row of rows) {
    const card = toQuoteCard(row);
    if (card.locationKind !== "neighborhood") continue;

    const slug = card.city === "Calgary"
      ? neighborhoodSlug(card.locality)
      : neighborhoodSlug(`${card.city}-${card.locality}`);
    const existing = grouped.get(slug) ?? {
      neighborhood: card.locality,
      city: card.city,
      quadrant: card.quadrant,
      lows: [],
      highs: [],
      lats: [],
      lngs: [],
      cards: []
    };

    if (typeof row.estimate_low === "number") existing.lows.push(row.estimate_low);
    if (typeof row.estimate_high === "number") existing.highs.push(row.estimate_high);
    if (typeof row.lat === "number") existing.lats.push(row.lat);
    if (typeof row.lng === "number") existing.lngs.push(row.lng);
    existing.cards.push(card);

    grouped.set(slug, existing);
  }

  return Array.from(grouped.entries())
    .map(([slug, value]) => ({
      neighborhood: value.neighborhood,
      slug,
      city: value.city,
      quadrant: value.quadrant,
      quoteCount: value.cards.length,
      averageLow: average(value.lows),
      averageHigh: average(value.highs),
      centroidLat: averageFloat(value.lats),
      centroidLng: averageFloat(value.lngs),
      cards: value.cards
        .sort((a, b) => new Date(b.queriedAt).getTime() - new Date(a.queriedAt).getTime())
    }))
    .sort((a, b) => b.quoteCount - a.quoteCount || a.neighborhood.localeCompare(b.neighborhood));
}

function buildAggregateSummaries(cards: QuoteCardData[]): QuoteArchiveAggregates {
  const cityMap = new Map<string, QuoteCardData[]>();
  const cityQuadrantMap = new Map<string, QuoteCardData[]>();
  const neighborhoodMap = new Map<string, QuoteCardData[]>();

  for (const card of cards) {
    const cityKey = card.city;
    cityMap.set(cityKey, [...(cityMap.get(cityKey) ?? []), card]);

    if (card.quadrant) {
      const cityQuadrantKey = `${card.city}|${card.quadrant}`;
      cityQuadrantMap.set(cityQuadrantKey, [...(cityQuadrantMap.get(cityQuadrantKey) ?? []), card]);
    }

    if (card.locationKind === "neighborhood") {
      const neighborhoodKey = `${card.city}|${card.locality}`;
      neighborhoodMap.set(neighborhoodKey, [...(neighborhoodMap.get(neighborhoodKey) ?? []), card]);
    }
  }

  const toSummary = (
    entries: Array<[string, QuoteCardData[]]>,
    buildTitle: (key: string, cards: QuoteCardData[]) => string,
    buildQuadrant: (key: string, cards: QuoteCardData[]) => string | null = (_, cards) => cards[0]?.quadrant ?? null
  ) => entries
    .map(([key, groupedCards]) => ({
      key,
      title: buildTitle(key, groupedCards),
      city: groupedCards[0]?.city ?? "Calgary",
      quadrant: buildQuadrant(key, groupedCards),
      quoteCount: groupedCards.length,
      averageLow: average(groupedCards.flatMap((card) => card.estimateLow !== null ? [card.estimateLow] : [])),
      averageHigh: average(groupedCards.flatMap((card) => card.estimateHigh !== null ? [card.estimateHigh] : []))
    }))
    .sort((a, b) => b.quoteCount - a.quoteCount || a.title.localeCompare(b.title));

  return {
    cities: toSummary(Array.from(cityMap.entries()), (key) => key, (_, cards) => cards[0]?.quadrant ?? null),
    cityQuadrants: toSummary(Array.from(cityQuadrantMap.entries()), (_, groupedCards) => groupedCards[0]?.cityQuadrantLabel ?? groupedCards[0]?.city ?? "Calgary"),
    neighborhoods: toSummary(
      Array.from(neighborhoodMap.entries()),
      (_, groupedCards) => groupedCards[0]?.city === "Calgary"
        ? groupedCards[0].locality
        : `${groupedCards[0]?.locality}, ${groupedCards[0]?.city}`,
      () => null
    )
  };
}

export async function getTopQuoteNeighborhoods(limit = 10) {
  const rows = await buildNeighborhoodSummaries();
  return rows.slice(0, limit);
}

export async function getAllQuoteNeighborhoods() {
  return buildNeighborhoodSummaries();
}

export async function getAllQuoteCards() {
  return getAllQuoteCardsInternal();
}

export async function getQuoteArchiveAggregates() {
  const cards = await getAllQuoteCardsInternal();
  return buildAggregateSummaries(cards);
}

export async function getQuoteArchiveByMaterial(): Promise<QuoteArchiveMaterialSection[]> {
  const cards = await getAllQuoteCardsInternal();
  const grouped = new Map<string, QuoteCardData[]>();
  const sortOrder = new Map([["Roofing", 1], ["Vinyl siding", 2], ["Hardie siding", 3], ["Eavestrough", 4], ["Mixed exterior scope", 5]]);

  for (const card of cards) {
    grouped.set(card.material, [...(grouped.get(card.material) ?? []), card]);
  }

  return Array.from(grouped.entries())
    .map(([material, materialCards]) => ({
      material,
      cards: materialCards,
      aggregates: buildAggregateSummaries(materialCards)
    }))
    .sort((a, b) => (sortOrder.get(a.material) ?? 99) - (sortOrder.get(b.material) ?? 99) || a.material.localeCompare(b.material));
}

export async function getQuoteNeighborhoodBySlug(slug: string) {
  const rows = await buildNeighborhoodSummaries();
  return rows.find((row) => row.slug === slug) ?? null;
}

export async function getQuoteQuadrantHeat(): Promise<QuadrantHeat> {
  const rows = await buildNeighborhoodSummaries();
  return rows.reduce<QuadrantHeat>((acc, row) => {
    if (row.city === "Calgary" && (row.quadrant === "NW" || row.quadrant === "NE" || row.quadrant === "SW" || row.quadrant === "SE")) {
      acc[row.quadrant] += row.quoteCount;
    }
    return acc;
  }, { NW: 0, NE: 0, SW: 0, SE: 0 });
}

export async function getNearestNeighborhoodLinksForProject(project: Project, limit = 3) {
  const rows = await buildNeighborhoodSummaries();
  const sameNeighborhood = project.neighborhood
    ? rows.find((row) => row.neighborhood.toLowerCase() === project.neighborhood?.toLowerCase() && row.city === project.city)
    : null;

  const ranked = rows
    .map((row) => ({
      row,
      distance:
        project.lat_public !== null &&
        project.lng_public !== null &&
        row.centroidLat !== null &&
        row.centroidLng !== null
          ? haversineKm(project.lat_public, project.lng_public, row.centroidLat, row.centroidLng)
          : Number.MAX_SAFE_INTEGER
    }))
    .sort((a, b) => a.distance - b.distance || b.row.quoteCount - a.row.quoteCount)
    .map((entry) => entry.row);

  const merged = sameNeighborhood
    ? [sameNeighborhood, ...ranked.filter((row) => row.slug !== sameNeighborhood.slug)]
    : ranked;

  return merged.slice(0, limit);
}

async function buildProjectNeighborhoodSummaries() {
  const projects = await listProjects({ include_unpublished: false, limit: 500 });
  const grouped = new Map<string, ProjectNeighborhoodSummary>();

  for (const project of projects) {
    if (project.city !== "Calgary") continue;
    const location = resolvePublicLocation({
      neighborhood: project.neighborhood,
      city: project.city,
      quadrant: project.quadrant
    });
    const neighborhood = location.locality;
    const slug = neighborhoodSlug(neighborhood);
    const existing = grouped.get(slug);

    if (existing) {
      existing.projectCount += 1;
      continue;
    }

    grouped.set(slug, {
      neighborhood,
      slug,
      city: project.city,
      quadrant: location.quadrant,
      projectCount: 1
    });
  }

  return Array.from(grouped.values())
    .sort((a, b) => b.projectCount - a.projectCount || a.neighborhood.localeCompare(b.neighborhood));
}

export async function getTopProjectNeighborhoods(limit = 10) {
  const rows = await buildProjectNeighborhoodSummaries();
  return rows.slice(0, limit);
}

export async function getProjectQuadrantHeat(): Promise<QuadrantHeat> {
  const rows = await buildProjectNeighborhoodSummaries();
  return rows.reduce<QuadrantHeat>((acc, row) => {
    if (row.quadrant === "NW" || row.quadrant === "NE" || row.quadrant === "SW" || row.quadrant === "SE") {
      acc[row.quadrant] += row.projectCount;
    }
    return acc;
  }, { NW: 0, NE: 0, SW: 0, SE: 0 });
}

export async function getProjectQuadrantLinks() {
  const rows = await buildProjectNeighborhoodSummaries();
  return {
    NW: rows.find((row) => row.quadrant === "NW")?.slug ?? null,
    NE: rows.find((row) => row.quadrant === "NE")?.slug ?? null,
    SW: rows.find((row) => row.quadrant === "SW")?.slug ?? null,
    SE: rows.find((row) => row.quadrant === "SE")?.slug ?? null
  };
}
