import assert from "node:assert/strict";
import test from "node:test";
import { geometryContainsPosition, geometryDistanceMetres, representativePosition } from "../lib/geography/geometry";
import { matchTrustedArea, normalizeGeographicName } from "../lib/geography/normalize";
import { validateCalgaryGeography } from "../lib/geography/validate";
import { buildReport, normalizeSource, quadrantFromSource } from "../scripts/update-calgary-geography";
import type { CalgaryCommunity, CalgaryGeometry } from "../lib/geography/types";

const square = (west: number, south: number, east: number, north: number): CalgaryGeometry => ({ type: "Polygon", coordinates: [[[west, south], [east, south], [east, north], [west, north], [west, south]]] });
const source = { type: "FeatureCollection" as const, features: [
  { type: "Feature" as const, properties: { comm_code: "A", name: "Tuscany", quadrant: "NORTHWEST" }, geometry: square(-114.25, 51.10, -114.20, 51.15) },
  { type: "Feature" as const, properties: { comm_code: "B", name: "Bowness", quadrant: "NORTHWEST" }, geometry: square(-114.20, 51.10, -114.15, 51.15) },
  { type: "Feature" as const, properties: { comm_code: "C", name: "Harvest Hills", quadrant: "NORTHEAST" }, geometry: square(-114.05, 51.10, -114.00, 51.15) },
] };

test("normalizes conservative geographic name variations", () => {
  assert.equal(normalizeGeographicName("North-West O’Neil"), "nw oneil");
  assert.notEqual(normalizeGeographicName("Marda Loop"), normalizeGeographicName("Altadore"));
});

test("handles exact, normalized, explicit alias, ambiguous and unmatched matches", () => {
  const communities = [
    { id: "1", officialName: "Auburn Bay", normalizedName: "auburn bay", aliases: ["Auburn-Bay"] },
    { id: "2", officialName: "Test East", normalizedName: "test", aliases: ["Shared"] },
    { id: "3", officialName: "Test West", normalizedName: "test", aliases: ["Shared"] },
  ] as CalgaryCommunity[];
  assert.equal(matchTrustedArea("Auburn Bay", communities).status, "exact");
  assert.equal(matchTrustedArea("Auburn-Bay", communities).status, "normalized");
  communities[0].aliases = ["Auburn Estates"];
  assert.equal(matchTrustedArea("Auburn Estates", communities).status, "alias");
  assert.equal(matchTrustedArea("Test", communities).status, "ambiguous");
  assert.equal(matchTrustedArea("Marda Loop", communities).status, "unmatched");
});

test("supports Polygon, holes and MultiPolygon point lookup", () => {
  const polygon = square(-114.2, 51.0, -114.1, 51.1);
  assert.equal(geometryContainsPosition(polygon, [-114.15, 51.05]), true);
  assert.equal(geometryContainsPosition(polygon, [51.05, -114.15]), false, "GeoJSON order must remain longitude, latitude");
  const multi: CalgaryGeometry = { type: "MultiPolygon", coordinates: [(polygon as Extract<CalgaryGeometry, { type: "Polygon" }>).coordinates, [[[-114.0, 51], [-113.9, 51], [-113.9, 51.1], [-114, 51.1], [-114, 51]]]] };
  assert.equal(geometryContainsPosition(multi, [-113.95, 51.05]), true);
  assert.equal(geometryContainsPosition(multi, [-114.05, 51.05]), false);
  assert.equal(geometryContainsPosition(multi, representativePosition(multi)), true);
});

test("derives quadrant, adjacency and deterministic non-adjacent nearby ordering", () => {
  const dataset = normalizeSource(source, "2026-08-27T00:00:00.000Z");
  assert.equal(quadrantFromSource("South East"), "SE");
  assert.equal(dataset.communities[0].quadrant, "NW");
  assert.deepEqual(dataset.communities[0].adjacentCommunityIds, ["B"]);
  assert.equal(dataset.communities[0].nearbyCommunityIds[0], "C");
  assert.equal(geometryDistanceMetres(dataset.communities[0].geometry, dataset.communities[1].geometry), 0);
});

test("normalizes source, reports every Trusted seed, and validates generated shape", () => {
  const dataset = normalizeSource(source, "2026-08-27T00:00:00.000Z");
  assert.doesNotThrow(() => validateCalgaryGeography(dataset));
  const report = buildReport(dataset);
  assert.match(report, /Existing Trusted service-area communities: 8/);
  assert.match(report, /Mahogany \| mahogany/);
  const broken = structuredClone(dataset); broken.communities[0].representativePoint = { latitude: -114.2, longitude: 51.1 };
  assert.throws(() => validateCalgaryGeography(broken), /not plausible/);
});
