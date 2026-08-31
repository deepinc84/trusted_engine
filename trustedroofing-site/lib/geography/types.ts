export type Position = [longitude: number, latitude: number];
export type CalgaryGeometry =
  | { type: "Polygon"; coordinates: Position[][] }
  | { type: "MultiPolygon"; coordinates: Position[][][] };
export type CalgaryQuadrant = "NW" | "NE" | "SW" | "SE" | "UNRESOLVED";
export type TrustedMatchStatus = "exact" | "normalized" | "alias" | "manual" | "unmatched" | "ambiguous";

export interface CalgaryCommunity {
  id: string;
  officialName: string;
  normalizedName: string;
  slug: string;
  city: "Calgary";
  quadrant: CalgaryQuadrant;
  representativePoint: { latitude: number; longitude: number };
  boundingBox: { minLongitude: number; minLatitude: number; maxLongitude: number; maxLatitude: number };
  geometry: CalgaryGeometry;
  adjacentCommunityIds: string[];
  nearbyCommunityIds: string[];
  aliases: string[];
  trustedServiceAreaSlug: string | null;
  trustedMatchStatus: TrustedMatchStatus;
}

export interface CalgaryGeographyDataset {
  metadata: {
    sourceName: string;
    sourceUrl: string;
    sourceDatasetIdentifier: string;
    retrievedAt: string;
    sourceVersion: string | null;
    adjacencyToleranceMetres: number;
    nearbyLimit: number;
  };
  communities: CalgaryCommunity[];
}
