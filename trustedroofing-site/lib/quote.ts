export const quoteScopes = [
  { value: "roofing", label: "Roof" },
  { value: "all", label: "All exterior scopes" },
  { value: "vinyl_siding", label: "Vinyl siding" },
  { value: "hardie_siding", label: "Hardie siding" },
  { value: "eavestrough", label: "Eavestrough" }
] as const;

export type QuoteScope = (typeof quoteScopes)[number]["value"];

export function defaultServiceTypeFromScope(scope: QuoteScope) {
  switch (scope) {
    case "all":
      return "All exterior scopes";
    case "vinyl_siding":
      return "Vinyl siding";
    case "hardie_siding":
      return "Hardie siding";
    case "eavestrough":
      return "Eavestrough";
    default:
      return "Roofing";
  }
}
