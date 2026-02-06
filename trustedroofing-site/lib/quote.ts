export const quoteScopes = [
  { value: "roofing", label: "Roof" },
  { value: "soft_metals", label: "Soft metals" },
  { value: "vinyl_siding", label: "Vinyl siding" },
  { value: "hardie_siding", label: "Hardie siding" },
  { value: "solar", label: "Solar" },
  { value: "full_exterior", label: "Full exterior package" }
] as const;

export type QuoteScope = (typeof quoteScopes)[number]["value"];

export function defaultServiceTypeFromScope(scope: QuoteScope) {
  switch (scope) {
    case "soft_metals":
      return "Soft metals";
    case "vinyl_siding":
      return "Vinyl siding";
    case "hardie_siding":
      return "Hardie siding";
    case "solar":
      return "Solar";
    case "full_exterior":
      return "Full exterior";
    default:
      return "Roofing";
  }
}
