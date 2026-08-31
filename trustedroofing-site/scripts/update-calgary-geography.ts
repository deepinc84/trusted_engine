import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { geometryBoundingBox, geometryDistanceMetres, representativePosition } from "../lib/geography/geometry";
import { matchTrustedArea, normalizeGeographicName } from "../lib/geography/normalize";
import { validateCalgaryGeography } from "../lib/geography/validate";
import type { CalgaryCommunity, CalgaryGeographyDataset, CalgaryGeometry, CalgaryQuadrant } from "../lib/geography/types";
import { officialCommunityAliases, trustedServiceAreas } from "../data/geography/trusted-service-areas";

export const SOURCE_URL = "https://data.calgary.ca/resource/surr-xmvs.geojson?$limit=5000";
const SOURCE_PAGE = "https://data.calgary.ca/Base-Maps/Community-District-Boundaries/surr-xmvs";
const OUTPUT = path.resolve(process.cwd(), "data/geography/calgary-communities.generated.json");
const REPORT = path.resolve(process.cwd(), "data/geography/calgary-geography-report.generated.md");
const ADJACENCY_TOLERANCE_METRES = 2;
const NEARBY_LIMIT = 6;

type SourceFeature = { type: "Feature"; properties: Record<string, unknown>; geometry: CalgaryGeometry };
type SourceCollection = { type: "FeatureCollection"; features: SourceFeature[] };

function textField(properties: Record<string, unknown>, keys: string[]) {
  for (const key of keys) if (typeof properties[key] === "string" && properties[key]) return String(properties[key]);
  return null;
}

export function quadrantFromSource(value: string | null): CalgaryQuadrant {
  const normalized = normalizeGeographicName(value ?? "");
  if (/^(nw|northwest)$/.test(normalized)) return "NW";
  if (/^(ne|northeast)$/.test(normalized)) return "NE";
  if (/^(sw|southwest)$/.test(normalized)) return "SW";
  if (/^(se|southeast)$/.test(normalized)) return "SE";
  return "UNRESOLVED";
}

export function normalizeSource(collection: SourceCollection, retrievedAt: string): CalgaryGeographyDataset {
  if (collection.type !== "FeatureCollection" || !Array.isArray(collection.features)) throw new Error("Source is not a GeoJSON FeatureCollection");
  const communities: CalgaryCommunity[] = collection.features.map((feature): CalgaryCommunity => {
    if (!feature.geometry || !["Polygon", "MultiPolygon"].includes(feature.geometry.type)) throw new Error("Source feature has malformed Polygon/MultiPolygon geometry");
    const officialName = textField(feature.properties, ["name", "NAME", "comm_name", "COMM_NAME"]);
    const id = textField(feature.properties, ["comm_code", "COMM_CODE", "community_code", "id"]);
    if (!officialName || !id) throw new Error("Source feature is missing its official name or community code");
    const representative = representativePosition(feature.geometry);
    return {
      id, officialName, normalizedName: normalizeGeographicName(officialName),
      slug: normalizeGeographicName(officialName).replace(/ /g, "-"), city: "Calgary",
      quadrant: quadrantFromSource(textField(feature.properties, ["quadrant", "QUADRANT", "sector", "SECTOR"])),
      representativePoint: { latitude: representative[1], longitude: representative[0] },
      boundingBox: geometryBoundingBox(feature.geometry), geometry: feature.geometry,
      adjacentCommunityIds: [], nearbyCommunityIds: [], aliases: officialCommunityAliases[id] ?? [],
      trustedServiceAreaSlug: null, trustedMatchStatus: "unmatched",
    };
  }).sort((a, b) => a.id.localeCompare(b.id));

  const distances = new Map<string, number>();
  for (let i = 0; i < communities.length; i++) for (let j = i + 1; j < communities.length; j++) {
    const a = communities[i], b = communities[j];
    const distance = geometryDistanceMetres(a.geometry, b.geometry);
    distances.set(`${a.id}\0${b.id}`, distance);
    if (distance <= ADJACENCY_TOLERANCE_METRES) { a.adjacentCommunityIds.push(b.id); b.adjacentCommunityIds.push(a.id); }
  }
  for (const community of communities) community.nearbyCommunityIds = communities
    .filter((candidate) => candidate.id !== community.id && !community.adjacentCommunityIds.includes(candidate.id))
    .map((candidate) => ({ id: candidate.id, distance: distances.get([community.id, candidate.id].sort().join("\0"))! }))
    .sort((a, b) => a.distance - b.distance || a.id.localeCompare(b.id)).slice(0, NEARBY_LIMIT).map(({ id }) => id);

  for (const trusted of trustedServiceAreas) {
    const match = matchTrustedArea(trusted.name, communities);
    if (match.communityId) { const community = communities.find((item) => item.id === match.communityId)!; community.trustedServiceAreaSlug = trusted.slug; community.trustedMatchStatus = match.status; }
  }
  return { metadata: { sourceName: "City of Calgary Community District Boundaries", sourceUrl: SOURCE_PAGE, sourceDatasetIdentifier: "surr-xmvs", retrievedAt, sourceVersion: null, adjacencyToleranceMetres: ADJACENCY_TOLERANCE_METRES, nearbyLimit: NEARBY_LIMIT }, communities };
}

export function buildReport(dataset: CalgaryGeographyDataset) {
  const byId = new Map(dataset.communities.map((c) => [c.id, c]));
  const matches = trustedServiceAreas.map((trusted) => {
    const community = dataset.communities.find((c) => c.trustedServiceAreaSlug === trusted.slug);
    const result = community ? community.trustedMatchStatus : matchTrustedArea(trusted.name, dataset.communities).status;
    return { trusted, community, result };
  });
  const count = (status: string) => matches.filter((m) => m.result === status).length;
  const lines = ["# CALGARY GEOGRAPHY IMPORT", "", `Source: ${dataset.metadata.sourceName}`, `Source URL: ${dataset.metadata.sourceUrl}`, `Retrieved: ${dataset.metadata.retrievedAt}`, `Official communities imported: ${dataset.communities.length}`, `Existing Trusted service-area communities: ${matches.length}`, `Exact matches: ${count("exact")}`, `Normalized matches: ${count("normalized")}`, `Alias matches: ${count("alias")}`, `Ambiguous: ${count("ambiguous")}`, `Unmatched: ${count("unmatched")}`, "", "## Full Trusted match report", "", "| Trusted name | Trusted slug | Official community | Match | Quadrant |", "|---|---|---|---|---|"];
  for (const m of matches) lines.push(`| ${m.trusted.name} | ${m.trusted.slug} | ${m.community?.officialName ?? "—"} | ${m.result} | ${m.community?.quadrant ?? "—"} |`);
  for (const community of dataset.communities) if (community.trustedServiceAreaSlug || ["Tuscany", "Bowness", "Harvest Hills", "Mahogany"].includes(community.officialName)) {
    lines.push("", `## ${community.officialName.toUpperCase()}`, "", `Official name: ${community.officialName}`, `Quadrant: ${community.quadrant}`, `Trusted slug: ${community.trustedServiceAreaSlug ?? "—"}`, `Match: ${community.trustedMatchStatus}`, `Representative point: ${community.representativePoint.latitude.toFixed(6)}, ${community.representativePoint.longitude.toFixed(6)}`, `Adjacent communities: ${community.adjacentCommunityIds.map((id) => byId.get(id)?.officialName).join(", ") || "—"}`, `Nearby communities: ${community.nearbyCommunityIds.map((id) => byId.get(id)?.officialName).join(", ") || "—"}`);
  }
  lines.push("", "## Unmatched Trusted communities", "", ...matches.filter((m) => m.result === "unmatched").map((m) => `- ${m.trusted.name} (${m.trusted.slug})`), "", "## Ambiguous Trusted communities", "", ...matches.filter((m) => m.result === "ambiguous").map((m) => `- ${m.trusted.name} (${m.trusted.slug})`));
  return `${lines.join("\n")}\n`;
}

async function main() {
  const inputFlag = process.argv.indexOf("--input");
  const retrievedAt = new Date().toISOString();
  const raw = inputFlag >= 0 ? await readFile(path.resolve(process.argv[inputFlag + 1]), "utf8") : await fetch(SOURCE_URL, { headers: { Accept: "application/geo+json" } }).then(async (response) => { if (!response.ok) throw new Error(`City source returned HTTP ${response.status}`); return response.text(); });
  const dataset = normalizeSource(JSON.parse(raw) as SourceCollection, retrievedAt);
  validateCalgaryGeography(dataset);
  await writeFile(OUTPUT, `${JSON.stringify(dataset)}\n`); await writeFile(REPORT, buildReport(dataset));
  console.log(buildReport(dataset));
}
if (require.main === module) main().catch((error) => { console.error(error); process.exitCode = 1; });
