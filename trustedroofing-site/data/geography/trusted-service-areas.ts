/** Committed service-area seeds. Runtime activity may create additional dormant match-report rows. */
export const trustedServiceAreas = [
  { name: "Mahogany", slug: "mahogany" }, { name: "Auburn Bay", slug: "auburn-bay" },
  { name: "Cranston", slug: "cranston" }, { name: "Seton", slug: "seton" },
  { name: "Altadore", slug: "altadore" }, { name: "Marda Loop", slug: "marda-loop" },
  { name: "Evergreen", slug: "evergreen" }, { name: "Legacy", slug: "legacy" },
] as const;

// Only municipality/source-confirmed alternatives belong here. Deliberately empty in Phase 1.
export const officialCommunityAliases: Record<string, string[]> = {};
