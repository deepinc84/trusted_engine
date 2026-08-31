import { geometryContainsPosition, geometryPolygons } from "./geometry";
import type { CalgaryGeographyDataset } from "./types";

export function validateCalgaryGeography(dataset: CalgaryGeographyDataset) {
  const errors: string[] = []; const ids = new Set<string>(); const trusted = new Map<string, string[]>();
  for (const community of dataset.communities) {
    if (ids.has(community.id)) errors.push(`Duplicate official ID: ${community.id}`); ids.add(community.id);
    const rings = geometryPolygons(community.geometry);
    if (!rings.length || rings.some((polygon) => !polygon.length || polygon.some((ring) => ring.length < 4))) errors.push(`${community.id}: malformed or empty geometry`);
    const { latitude, longitude } = community.representativePoint;
    if (longitude >= 0 || longitude < -115 || longitude > -113 || latitude < 50 || latitude > 52) errors.push(`${community.id}: representative point is not plausible for Calgary`);
    if (!geometryContainsPosition(community.geometry, [longitude, latitude])) errors.push(`${community.id}: representative point is outside geometry`);
    if (community.adjacentCommunityIds.includes(community.id)) errors.push(`${community.id}: adjacent to itself`);
    if (community.nearbyCommunityIds.includes(community.id)) errors.push(`${community.id}: nearby itself`);
    if (community.trustedServiceAreaSlug) trusted.set(community.trustedServiceAreaSlug, [...(trusted.get(community.trustedServiceAreaSlug) ?? []), community.id]);
    if (community.trustedServiceAreaSlug && community.quadrant === "UNRESOLVED") errors.push(`${community.id}: matched community has unresolved quadrant`);
  }
  for (const [slug, matches] of trusted) if (matches.length > 1) errors.push(`Duplicate Trusted slug mapping ${slug}: ${matches.join(", ")}`);
  if (errors.length) throw new Error(errors.join("\n"));
}
