import "server-only";
import datasetJson from "../../data/geography/calgary-communities.generated.json";
import { geometryContainsPosition } from "./geometry";
import { normalizeGeographicName } from "./normalize";
import type { CalgaryGeographyDataset, CalgaryQuadrant } from "./types";

const dataset = datasetJson as CalgaryGeographyDataset;
const byId = new Map(dataset.communities.map((community) => [community.id, community]));
export const getCommunityById = (id: string) => byId.get(id) ?? null;
export const getCommunityBySlug = (slug: string) => dataset.communities.find((c) => c.slug === slug) ?? null;
export const getCommunityByOfficialName = (name: string) => dataset.communities.find((c) => c.normalizedName === normalizeGeographicName(name)) ?? null;
export const getCommunityByTrustedSlug = (slug: string) => dataset.communities.find((c) => c.trustedServiceAreaSlug === slug) ?? null;
export const getCommunitiesByQuadrant = (quadrant: CalgaryQuadrant) => dataset.communities.filter((c) => c.quadrant === quadrant);
export const getAdjacentCommunities = (id: string) => (byId.get(id)?.adjacentCommunityIds ?? []).map((relatedId) => byId.get(relatedId)).filter(Boolean);
export const getNearbyCommunities = (id: string) => (byId.get(id)?.nearbyCommunityIds ?? []).map((relatedId) => byId.get(relatedId)).filter(Boolean);
export const getQuadrantForCommunity = (id: string) => byId.get(id)?.quadrant ?? null;
export function findCommunityContainingPoint(latitude: number, longitude: number) {
  return dataset.communities.find((community) => {
    const b = community.boundingBox;
    return longitude >= b.minLongitude && longitude <= b.maxLongitude && latitude >= b.minLatitude && latitude <= b.maxLatitude && geometryContainsPosition(community.geometry, [longitude, latitude]);
  }) ?? null;
}
