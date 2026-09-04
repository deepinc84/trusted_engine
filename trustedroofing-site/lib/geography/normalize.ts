import type { CalgaryCommunity, TrustedMatchStatus } from "./types";

export function normalizeGeographicName(value: string) {
  return value.normalize("NFKD").replace(/[’']/g, "").replace(/&/g, " and ").replace(/\b(north[ -]?west)\b/gi, "nw").replace(/\b(north[ -]?east)\b/gi, "ne").replace(/\b(south[ -]?west)\b/gi, "sw").replace(/\b(south[ -]?east)\b/gi, "se").replace(/[^a-z0-9]+/gi, " ").trim().replace(/\s+/g, " ").toLowerCase();
}

export function matchTrustedArea(name: string, communities: Pick<CalgaryCommunity, "id" | "officialName" | "normalizedName" | "aliases">[]) {
  const exact = communities.filter((c) => c.officialName.toLocaleLowerCase("en-CA") === name.toLocaleLowerCase("en-CA"));
  if (exact.length === 1) return { communityId: exact[0].id, status: "exact" as TrustedMatchStatus };
  const normalized = normalizeGeographicName(name);
  const candidates = communities.filter((c) => c.normalizedName === normalized);
  if (candidates.length === 1) return { communityId: candidates[0].id, status: "normalized" as TrustedMatchStatus };
  if (candidates.length > 1) return { communityId: null, status: "ambiguous" as TrustedMatchStatus };
  const aliases = communities.filter((c) => c.aliases.some((alias) => normalizeGeographicName(alias) === normalized));
  if (aliases.length === 1) return { communityId: aliases[0].id, status: "alias" as TrustedMatchStatus };
  return { communityId: null, status: aliases.length > 1 ? "ambiguous" as const : "unmatched" as const };
}
