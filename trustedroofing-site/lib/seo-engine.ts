import type {
  Project,
  InstaquoteAddressQuery,
  ResolvedGeoPost,
  SolarSuitabilityAnalysis,
} from "./db";
import {
  listGeoPosts,
  listProjects,
  listRecentInstaquoteAddressQueries,
  listSolarSuitabilityAnalyses,
} from "./db";
import { haversineKm } from "./geo";
import {
  buildQuoteAnchorSlug,
  buildQuoteSignalTitle,
  neighborhoodSlug,
  normalizeNeighborhoodSlug,
  quoteComplexityLabel,
  quoteMaterialLabel,
  resolvePublicLocation,
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
  scope: string | null;
  serviceType: string | null;
  requestedScopes: string[] | null;
  roofAreaSqft: number | null;
  pitchDegrees: number | null;
  complexityBand: string | null;
  sidingAreaSqft: number | null;
  eavesLengthLf: number | null;
  stories: number | null;
  estimateBasis: string | null;
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

export type UnifiedNeighborhoodActivity = QuoteNeighborhoodSummary & {
  projectCount: number;
  solarActivityCount: number;
  geoPostEnrichmentCount: number;
  has_quotes: boolean;
  has_projects: boolean;
  has_solar_activity: boolean;
  has_geo_post_enrichment: boolean;
  projects: Project[];
  geoPosts: ResolvedGeoPost[];
  solarAnalyses: SolarSuitabilityAnalysis[];
};

function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length,
  );
}

function averageFloat(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function toQuoteCard(row: InstaquoteAddressQuery): QuoteCardData {
  const location = resolvePublicLocation({
    neighborhood: row.neighborhood,
    address: row.address,
  });
  const material = quoteMaterialLabel(row.service_type, row.requested_scopes);
  const complexity = quoteComplexityLabel(row.complexity_band);
  const estimateLow =
    typeof row.estimate_low === "number" ? row.estimate_low : null;
  const estimateHigh =
    typeof row.estimate_high === "number" ? row.estimate_high : null;

  return {
    id: row.id,
    locality: location.locality,
    neighborhood: location.locality,
    slug: buildQuoteAnchorSlug(
      material,
      location.locality,
      location.city,
      String(row.id),
    ),
    city: location.city,
    locationLabel: location.label,
    cityQuadrantLabel: location.cityQuadrantLabel,
    locationKind: location.kind,
    quadrant: location.quadrant,
    complexity,
    material,
    estimateLow,
    estimateHigh,
    scope: row.requested_scopes?.[0] ?? null,
    serviceType: row.service_type,
    requestedScopes: row.requested_scopes,
    roofAreaSqft:
      typeof row.roof_area_sqft === "number" ? row.roof_area_sqft : null,
    pitchDegrees:
      typeof row.pitch_degrees === "number" ? row.pitch_degrees : null,
    complexityBand: row.complexity_band,
    sidingAreaSqft: null,
    eavesLengthLf: null,
    stories: 2,
    estimateBasis: null,
    queriedAt: row.queried_at,
    title: buildQuoteSignalTitle(material, location.locality, location.city),
    description: `Recent address-level ${material.toLowerCase()} estimate generated for this area. Modeled estimate signal based on recent local property inputs.`,
  };
}

async function getAllQuoteCardsInternal() {
  const rows = await listRecentInstaquoteAddressQueries(1200);
  return rows
    .map(toQuoteCard)
    .filter((card) => card.city.length > 0)
    .sort(
      (a, b) =>
        new Date(b.queriedAt).getTime() - new Date(a.queriedAt).getTime(),
    );
}

async function buildNeighborhoodSummaries() {
  const rows = await listRecentInstaquoteAddressQueries(1200);
  const grouped = new Map<
    string,
    {
      neighborhood: string;
      city: string;
      quadrant: string | null;
      lows: number[];
      highs: number[];
      lats: number[];
      lngs: number[];
      cards: QuoteCardData[];
    }
  >();

  for (const row of rows) {
    const card = toQuoteCard(row);
    if (card.locationKind !== "neighborhood") continue;

    const slug =
      card.city === "Calgary"
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
      cards: [],
    };

    if (typeof row.estimate_low === "number")
      existing.lows.push(row.estimate_low);
    if (typeof row.estimate_high === "number")
      existing.highs.push(row.estimate_high);
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
      cards: value.cards.sort(
        (a, b) =>
          new Date(b.queriedAt).getTime() - new Date(a.queriedAt).getTime(),
      ),
    }))
    .sort(
      (a, b) =>
        b.quoteCount - a.quoteCount ||
        a.neighborhood.localeCompare(b.neighborhood),
    );
}

function buildAggregateSummaries(
  cards: QuoteCardData[],
): QuoteArchiveAggregates {
  const cityMap = new Map<string, QuoteCardData[]>();
  const cityQuadrantMap = new Map<string, QuoteCardData[]>();
  const neighborhoodMap = new Map<string, QuoteCardData[]>();

  for (const card of cards) {
    const cityKey = card.city;
    cityMap.set(cityKey, [...(cityMap.get(cityKey) ?? []), card]);

    if (card.quadrant) {
      const cityQuadrantKey = `${card.city}|${card.quadrant}`;
      cityQuadrantMap.set(cityQuadrantKey, [
        ...(cityQuadrantMap.get(cityQuadrantKey) ?? []),
        card,
      ]);
    }

    if (card.locationKind === "neighborhood") {
      const neighborhoodKey = `${card.city}|${card.locality}`;
      neighborhoodMap.set(neighborhoodKey, [
        ...(neighborhoodMap.get(neighborhoodKey) ?? []),
        card,
      ]);
    }
  }

  const toSummary = (
    entries: Array<[string, QuoteCardData[]]>,
    buildTitle: (key: string, cards: QuoteCardData[]) => string,
    buildQuadrant: (key: string, cards: QuoteCardData[]) => string | null = (
      _,
      cards,
    ) => cards[0]?.quadrant ?? null,
  ) =>
    entries
      .map(([key, groupedCards]) => ({
        key,
        title: buildTitle(key, groupedCards),
        city: groupedCards[0]?.city ?? "Calgary",
        quadrant: buildQuadrant(key, groupedCards),
        quoteCount: groupedCards.length,
        averageLow: average(
          groupedCards.flatMap((card) =>
            card.estimateLow !== null ? [card.estimateLow] : [],
          ),
        ),
        averageHigh: average(
          groupedCards.flatMap((card) =>
            card.estimateHigh !== null ? [card.estimateHigh] : [],
          ),
        ),
      }))
      .sort(
        (a, b) => b.quoteCount - a.quoteCount || a.title.localeCompare(b.title),
      );

  return {
    cities: toSummary(
      Array.from(cityMap.entries()),
      (key) => key,
      (_, cards) => cards[0]?.quadrant ?? null,
    ),
    cityQuadrants: toSummary(
      Array.from(cityQuadrantMap.entries()),
      (_, groupedCards) =>
        groupedCards[0]?.cityQuadrantLabel ??
        groupedCards[0]?.city ??
        "Calgary",
    ),
    neighborhoods: toSummary(
      Array.from(neighborhoodMap.entries()),
      (_, groupedCards) =>
        groupedCards[0]?.city === "Calgary"
          ? groupedCards[0].locality
          : `${groupedCards[0]?.locality}, ${groupedCards[0]?.city}`,
      () => null,
    ),
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

export async function getQuoteArchiveByMaterial(): Promise<
  QuoteArchiveMaterialSection[]
> {
  const cards = await getAllQuoteCardsInternal();
  const grouped = new Map<string, QuoteCardData[]>();
  const sortOrder = new Map([
    ["Roofing", 1],
    ["Vinyl siding", 2],
    ["Hardie siding", 3],
    ["Eavestrough", 4],
    ["Mixed exterior scope", 5],
  ]);

  for (const card of cards) {
    grouped.set(card.material, [...(grouped.get(card.material) ?? []), card]);
  }

  return Array.from(grouped.entries())
    .map(([material, materialCards]) => ({
      material,
      cards: materialCards,
      aggregates: buildAggregateSummaries(materialCards),
    }))
    .sort(
      (a, b) =>
        (sortOrder.get(a.material) ?? 99) - (sortOrder.get(b.material) ?? 99) ||
        a.material.localeCompare(b.material),
    );
}

export async function getQuoteNeighborhoodBySlug(slug: string) {
  const rows = await buildNeighborhoodSummaries();
  const normalizedSlug = normalizeNeighborhoodSlug(slug);
  return rows.find((row) => row.slug === normalizedSlug) ?? null;
}

export async function getQuoteQuadrantHeat(): Promise<QuadrantHeat> {
  const rows = await buildNeighborhoodSummaries();
  return rows.reduce<QuadrantHeat>(
    (acc, row) => {
      if (
        row.city === "Calgary" &&
        (row.quadrant === "NW" ||
          row.quadrant === "NE" ||
          row.quadrant === "SW" ||
          row.quadrant === "SE")
      ) {
        acc[row.quadrant] += row.quoteCount;
      }
      return acc;
    },
    { NW: 0, NE: 0, SW: 0, SE: 0 },
  );
}

export async function getNearestNeighborhoodLinksForProject(
  project: Project,
  limit = 3,
) {
  const rows = await buildNeighborhoodSummaries();
  const sameNeighborhood = project.neighborhood
    ? rows.find(
        (row) =>
          row.neighborhood.toLowerCase() ===
            project.neighborhood?.toLowerCase() && row.city === project.city,
      )
    : null;

  const ranked = rows
    .map((row) => ({
      row,
      distance:
        project.lat_public !== null &&
        project.lng_public !== null &&
        row.centroidLat !== null &&
        row.centroidLng !== null
          ? haversineKm(
              project.lat_public,
              project.lng_public,
              row.centroidLat,
              row.centroidLng,
            )
          : Number.MAX_SAFE_INTEGER,
    }))
    .sort(
      (a, b) => a.distance - b.distance || b.row.quoteCount - a.row.quoteCount,
    )
    .map((entry) => entry.row);

  const merged = sameNeighborhood
    ? [
        sameNeighborhood,
        ...ranked.filter((row) => row.slug !== sameNeighborhood.slug),
      ]
    : ranked;

  return merged.slice(0, limit);
}

async function buildProjectNeighborhoodSummaries() {
  const projects = await listProjects({
    include_unpublished: false,
    limit: 500,
  });
  const grouped = new Map<string, ProjectNeighborhoodSummary>();

  for (const project of projects) {
    if (project.city !== "Calgary") continue;
    const location = resolvePublicLocation({
      neighborhood: project.neighborhood,
      city: project.city,
      quadrant: project.quadrant,
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
      projectCount: 1,
    });
  }

  return Array.from(grouped.values()).sort(
    (a, b) =>
      b.projectCount - a.projectCount ||
      a.neighborhood.localeCompare(b.neighborhood),
  );
}

export async function getTopProjectNeighborhoods(limit = 10) {
  const rows = await buildProjectNeighborhoodSummaries();
  return rows.slice(0, limit);
}

export async function getProjectQuadrantHeat(): Promise<QuadrantHeat> {
  const rows = await buildProjectNeighborhoodSummaries();
  return rows.reduce<QuadrantHeat>(
    (acc, row) => {
      if (
        row.quadrant === "NW" ||
        row.quadrant === "NE" ||
        row.quadrant === "SW" ||
        row.quadrant === "SE"
      ) {
        acc[row.quadrant] += row.projectCount;
      }
      return acc;
    },
    { NW: 0, NE: 0, SW: 0, SE: 0 },
  );
}

export async function getProjectQuadrantLinks() {
  const rows = await buildProjectNeighborhoodSummaries();
  return {
    NW: rows.find((row) => row.quadrant === "NW")?.slug ?? null,
    NE: rows.find((row) => row.quadrant === "NE")?.slug ?? null,
    SW: rows.find((row) => row.quadrant === "SW")?.slug ?? null,
    SE: rows.find((row) => row.quadrant === "SE")?.slug ?? null,
  };
}

type MutableUnifiedNeighborhood = {
  neighborhood: string;
  slug: string;
  city: string;
  quadrant: string | null;
  lows: number[];
  highs: number[];
  lats: number[];
  lngs: number[];
  cards: QuoteCardData[];
  projects: Project[];
  solarAnalyses: SolarSuitabilityAnalysis[];
  geoPosts: ResolvedGeoPost[];
};

function slugForLocality(city: string, locality: string) {
  return city === "Calgary"
    ? neighborhoodSlug(locality)
    : neighborhoodSlug(`${city}-${locality}`);
}

function ensureUnifiedGroup(
  grouped: Map<string, MutableUnifiedNeighborhood>,
  input: {
    neighborhood: string;
    city: string;
    quadrant: string | null;
    slug?: string | null;
  },
) {
  const slug = input.slug || slugForLocality(input.city, input.neighborhood);
  const existing = grouped.get(slug);
  if (existing) return existing;

  const created: MutableUnifiedNeighborhood = {
    neighborhood: input.neighborhood,
    slug,
    city: input.city,
    quadrant: input.quadrant,
    lows: [],
    highs: [],
    lats: [],
    lngs: [],
    cards: [],
    projects: [],
    solarAnalyses: [],
    geoPosts: [],
  };
  grouped.set(slug, created);
  return created;
}

async function buildUnifiedNeighborhoodActivities(): Promise<
  UnifiedNeighborhoodActivity[]
> {
  const [quoteRows, projects, solarAnalyses, geoPosts] = await Promise.all([
    listRecentInstaquoteAddressQueries(1200),
    listProjects({ include_unpublished: false, limit: 500 }),
    listSolarSuitabilityAnalyses({ limit: 1200 }),
    listGeoPosts(500),
  ]);
  const grouped = new Map<string, MutableUnifiedNeighborhood>();

  for (const row of quoteRows) {
    const card = toQuoteCard(row);
    if (card.locationKind !== "neighborhood") continue;
    const group = ensureUnifiedGroup(grouped, {
      neighborhood: card.locality,
      city: card.city,
      quadrant: card.quadrant,
      slug: slugForLocality(card.city, card.locality),
    });
    if (typeof row.estimate_low === "number") group.lows.push(row.estimate_low);
    if (typeof row.estimate_high === "number")
      group.highs.push(row.estimate_high);
    if (typeof row.lat === "number") group.lats.push(row.lat);
    if (typeof row.lng === "number") group.lngs.push(row.lng);
    group.cards.push(card);
  }

  const publishedProjectIds = new Set<string>();
  for (const project of projects) {
    const location = resolvePublicLocation({
      neighborhood: project.neighborhood,
      city: project.city,
      quadrant: project.quadrant,
    });
    if (location.kind !== "neighborhood") continue;
    publishedProjectIds.add(project.id);
    const group = ensureUnifiedGroup(grouped, {
      neighborhood: location.locality,
      city: location.city,
      quadrant: location.quadrant,
      slug: slugForLocality(location.city, location.locality),
    });
    group.projects.push(project);
    if (typeof project.lat_public === "number")
      group.lats.push(project.lat_public);
    if (typeof project.lng_public === "number")
      group.lngs.push(project.lng_public);
  }

  for (const solar of solarAnalyses) {
    if (!solar.neighborhood || !solar.neighborhood_slug) continue;
    const group = ensureUnifiedGroup(grouped, {
      neighborhood: solar.neighborhood,
      city: solar.city || "Calgary",
      quadrant: solar.quadrant,
      slug: solar.neighborhood_slug,
    });
    group.solarAnalyses.push(solar);
    if (typeof solar.latitude === "number") group.lats.push(solar.latitude);
    if (typeof solar.longitude === "number") group.lngs.push(solar.longitude);
  }

  for (const geoPost of geoPosts) {
    if (!publishedProjectIds.has(geoPost.project_id)) continue;
    const relatedProject =
      projects.find((project) => project.id === geoPost.project_id) ?? null;
    const location = resolvePublicLocation({
      neighborhood: relatedProject?.neighborhood ?? geoPost.neighborhood,
      city: relatedProject?.city ?? geoPost.city,
      quadrant: relatedProject?.quadrant ?? null,
    });
    if (location.kind !== "neighborhood") continue;
    const group = ensureUnifiedGroup(grouped, {
      neighborhood: location.locality,
      city: location.city,
      quadrant: location.quadrant,
      slug: slugForLocality(location.city, location.locality),
    });
    group.geoPosts.push(geoPost);
  }

  return Array.from(grouped.values())
    .filter(
      (value) =>
        value.cards.length > 0 ||
        value.projects.length > 0 ||
        value.solarAnalyses.length > 0,
    )
    .map((value) => ({
      neighborhood: value.neighborhood,
      slug: value.slug,
      city: value.city,
      quadrant: value.quadrant,
      quoteCount: value.cards.length,
      averageLow: average(value.lows),
      averageHigh: average(value.highs),
      centroidLat: averageFloat(value.lats),
      centroidLng: averageFloat(value.lngs),
      cards: value.cards.sort(
        (a, b) =>
          new Date(b.queriedAt).getTime() - new Date(a.queriedAt).getTime(),
      ),
      projectCount: value.projects.length,
      solarActivityCount: value.solarAnalyses.length,
      geoPostEnrichmentCount: value.geoPosts.length,
      has_quotes: value.cards.length > 0,
      has_projects: value.projects.length > 0,
      has_solar_activity: value.solarAnalyses.length > 0,
      has_geo_post_enrichment: value.geoPosts.length > 0,
      projects: value.projects.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
      geoPosts: value.geoPosts.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
      solarAnalyses: value.solarAnalyses.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    }))
    .sort(
      (a, b) =>
        b.quoteCount +
          b.projectCount +
          b.solarActivityCount -
          (a.quoteCount + a.projectCount + a.solarActivityCount) ||
        a.neighborhood.localeCompare(b.neighborhood),
    );
}

export async function getAllNeighborhoodActivities() {
  return buildUnifiedNeighborhoodActivities();
}

export async function getNeighborhoodActivityBySlug(slug: string) {
  const rows = await buildUnifiedNeighborhoodActivities();
  const normalizedSlug = normalizeNeighborhoodSlug(slug);
  return rows.find((row) => row.slug === normalizedSlug) ?? null;
}

export async function getTopNeighborhoodActivities(limit = 10) {
  const rows = await buildUnifiedNeighborhoodActivities();
  return rows.slice(0, limit);
}
