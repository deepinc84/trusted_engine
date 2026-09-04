import type { CalgaryGeometry, Position } from "./types";

const METRES_PER_DEGREE_LATITUDE = 111_320;
const calgaryLongitudeScale = METRES_PER_DEGREE_LATITUDE * Math.cos(51.05 * Math.PI / 180);

export function geometryPolygons(geometry: CalgaryGeometry): Position[][][] {
  return geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
}

function pointInRing(point: Position, ring: Position[]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]; const [xj, yj] = ring[j];
    if (((yi > point[1]) !== (yj > point[1])) && point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function geometryContainsPosition(geometry: CalgaryGeometry, point: Position) {
  return geometryPolygons(geometry).some((polygon) => pointInRing(point, polygon[0]) && !polygon.slice(1).some((hole) => pointInRing(point, hole)));
}

export function geometryBoundingBox(geometry: CalgaryGeometry) {
  const positions = geometryPolygons(geometry).flat(2);
  return {
    minLongitude: Math.min(...positions.map((p) => p[0])), minLatitude: Math.min(...positions.map((p) => p[1])),
    maxLongitude: Math.max(...positions.map((p) => p[0])), maxLatitude: Math.max(...positions.map((p) => p[1])),
  };
}

function ringCentroid(ring: Position[]): Position {
  let area = 0, x = 0, y = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const cross = ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    area += cross; x += (ring[i][0] + ring[i + 1][0]) * cross; y += (ring[i][1] + ring[i + 1][1]) * cross;
  }
  return Math.abs(area) < 1e-12 ? ring[0] : [x / (3 * area), y / (3 * area)];
}

export function representativePosition(geometry: CalgaryGeometry): Position {
  const polygons = geometryPolygons(geometry);
  const largest = [...polygons].sort((a, b) => b[0].length - a[0].length)[0];
  const centroid = ringCentroid(largest[0]);
  if (geometryContainsPosition(geometry, centroid)) return centroid;
  const box = geometryBoundingBox(geometry);
  for (let resolution = 8; resolution <= 64; resolution *= 2) {
    for (let y = 1; y < resolution; y++) for (let x = 1; x < resolution; x++) {
      const candidate: Position = [box.minLongitude + (box.maxLongitude - box.minLongitude) * x / resolution, box.minLatitude + (box.maxLatitude - box.minLatitude) * y / resolution];
      if (geometryContainsPosition(geometry, candidate)) return candidate;
    }
  }
  return largest[0][0];
}

function pointSegmentDistanceMetres(p: Position, a: Position, b: Position) {
  const px = p[0] * calgaryLongitudeScale, py = p[1] * METRES_PER_DEGREE_LATITUDE;
  const ax = a[0] * calgaryLongitudeScale, ay = a[1] * METRES_PER_DEGREE_LATITUDE;
  const bx = b[0] * calgaryLongitudeScale, by = b[1] * METRES_PER_DEGREE_LATITUDE;
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function geometryDistanceMetres(a: CalgaryGeometry, b: CalgaryGeometry) {
  if (geometryPolygons(a).some((p) => geometryContainsPosition(b, p[0][0])) || geometryPolygons(b).some((p) => geometryContainsPosition(a, p[0][0]))) return 0;
  let minimum = Infinity;
  const ringsA = geometryPolygons(a).flat(); const ringsB = geometryPolygons(b).flat();
  for (const ringA of ringsA) for (const point of ringA) for (const ringB of ringsB) for (let i = 0; i < ringB.length - 1; i++) minimum = Math.min(minimum, pointSegmentDistanceMetres(point, ringB[i], ringB[i + 1]));
  for (const ringB of ringsB) for (const point of ringB) for (const ringA of ringsA) for (let i = 0; i < ringA.length - 1; i++) minimum = Math.min(minimum, pointSegmentDistanceMetres(point, ringA[i], ringA[i + 1]));
  return minimum;
}
