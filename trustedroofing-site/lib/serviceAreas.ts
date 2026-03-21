import { sanitizeText } from "./sanitize";

const STREET_SUFFIX_RE = /\b(?:street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd|lane|ln|way|trail|trl|court|ct|circle|cir|place|pl|terrace|ter|crescent|cres|close|square|sq|park|pkwy|parkway|gate|gardens|garden|heights|hill|landing|manor|common|mews)\b/i;
const PROVINCE_RE = /\b(?:AB|Alberta)\b/i;
const POSTAL_RE = /\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/i;

function cleanPart(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function extractQuadrant(value: string | null | undefined) {
  return value?.toUpperCase().match(/\b(NE|NW|SE|SW)\b/)?.[1] ?? null;
}

export function extractCity(value: string | null | undefined) {
  if (!value) return null;
  const parts = value.split(",").map(cleanPart).filter(Boolean);
  const cityPart = parts.find((part) => /calgary/i.test(part));
  return cityPart ? "Calgary" : null;
}

export function extractNeighborhood(value: string | null | undefined) {
  if (!value) return null;

  const parts = value
    .split(",")
    .map(cleanPart)
    .filter(Boolean)
    .filter((part) => !/calgary/i.test(part))
    .filter((part) => !PROVINCE_RE.test(part))
    .filter((part) => !POSTAL_RE.test(part));

  const candidate = parts.find((part) => !/\d/.test(part) && !STREET_SUFFIX_RE.test(part));
  if (!candidate) return null;

  return candidate
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function neighborhoodSlug(value: string) {
  return sanitizeText(value);
}

export function quoteMaterialLabel(serviceType: string | null, requestedScopes: string[] | null) {
  if (requestedScopes?.includes("siding_hardie") || serviceType?.includes("Hardie")) return "Hardie siding";
  if (requestedScopes?.includes("siding_vinyl") || serviceType?.includes("Vinyl")) return "Vinyl siding";
  if (requestedScopes?.includes("eavestrough") || serviceType?.includes("Eavestrough")) return "Eavestrough";
  if ((requestedScopes?.length ?? 0) > 1 || serviceType?.includes("All")) return "Mixed exterior scope";
  return "Roofing";
}

export function quoteComplexityLabel(value: string | null | undefined) {
  if (value === "simple") return "Simple";
  if (value === "complex") return "Complex";
  if (value === "moderate") return "Moderate";
  return "Not specified";
}
