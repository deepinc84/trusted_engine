import { unstable_cache } from "next/cache";
import type { Project, InstaquoteAddressQuery } from "./db";
import { listRecentInstaquoteAddressQueries } from "./db";
import { haversineKm } from "./geo";
import {
  extractCity,
  extractNeighborhood,
  extractQuadrant,
  neighborhoodSlug,
  quoteComplexityLabel,
  quoteMaterialLabel
} from "./serviceAreas";

export type QuoteCardData = {
  id: string;
  neighborhood: string;
  slug: string;
  city: string;
  quadrant: string | null;
  complexity: string;
  material: string;
  estimateLow: number | null;
  estimateHigh: number | null;
  queriedAt: string;
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

export type QuadrantHeat = Record<"NW" | "NE" | "SW" | "SE", number>;

function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function averageFloat(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function toQuoteCard(row: InstaquoteAddressQuery, neighborhood: string, city: string): QuoteCardData {
  const slug = neighborhoodSlug(neighborhood);
  const quadrant = extractQuadrant(row.address);
  const material = quoteMaterialLabel(row.service_type, row.requested_scopes);
  const complexity = quoteComplexityLabel(row.complexity_band);
  const estimateLow = typeof row.estimate_low === "number" ? row.estimate_low : null;
  const estimateHigh = typeof row.estimate_high === "number" ? row.estimate_high : null;

  return {
    id: row.id,
    neighborhood,
    slug,
    city,
    quadrant,
    complexity,
    material,
    estimateLow,
    estimateHigh,
    queriedAt: row.queried_at,
    description: estimateLow !== null && estimateHigh !== null
      ? `Recent ${material.toLowerCase()} quote activity in ${neighborhood} ranging from $${Math.round(estimateLow).toLocaleString()} to $${Math.round(estimateHigh).toLocaleString()}.`
      : `Recent ${material.toLowerCase()} quote activity in ${neighborhood}, Calgary with live pricing context.`
  };
}

async function buildNeighborhoodSummaries() {
  const rows = await listRecentInstaquoteAddressQueries(800);
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
    const city = extractCity(row.address) ?? "Calgary";
    if (city !== "Calgary") continue;

    const neighborhood = extractNeighborhood(row.address);
    if (!neighborhood) continue;

    const slug = neighborhoodSlug(neighborhood);
    const existing = grouped.get(slug) ?? {
      neighborhood,
      city,
      quadrant: extractQuadrant(row.address),
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
    existing.cards.push(toQuoteCard(row, neighborhood, city));

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
        .slice(0, 6)
    }))
    .sort((a, b) => b.quoteCount - a.quoteCount || a.neighborhood.localeCompare(b.neighborhood));
}

const getCachedNeighborhoodSummaries = unstable_cache(buildNeighborhoodSummaries, ["seo-neighborhood-summaries"], {
  revalidate: 3600
});

export async function getTopQuoteNeighborhoods(limit = 10) {
  const rows = await getCachedNeighborhoodSummaries();
  return rows.slice(0, limit);
}

export async function getAllQuoteNeighborhoods() {
  return getCachedNeighborhoodSummaries();
}

export async function getQuoteNeighborhoodBySlug(slug: string) {
  const rows = await getCachedNeighborhoodSummaries();
  return rows.find((row) => row.slug === slug) ?? null;
}

export async function getQuoteQuadrantHeat(): Promise<QuadrantHeat> {
  const rows = await getCachedNeighborhoodSummaries();
  return rows.reduce<QuadrantHeat>((acc, row) => {
    if (row.quadrant === "NW" || row.quadrant === "NE" || row.quadrant === "SW" || row.quadrant === "SE") {
      acc[row.quadrant] += row.quoteCount;
    }
    return acc;
  }, { NW: 0, NE: 0, SW: 0, SE: 0 });
}

export async function getNearestNeighborhoodLinksForProject(project: Project, limit = 3) {
  const rows = await getCachedNeighborhoodSummaries();
  const sameNeighborhood = project.neighborhood
    ? rows.find((row) => row.neighborhood.toLowerCase() === project.neighborhood?.toLowerCase())
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
