import { sanitizeText } from "./sanitize";

const STREET_SUFFIX_RE = /\b(?:street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd|lane|ln|way|trail|trl|court|ct|circle|cir|place|pl|terrace|ter|crescent|cres|close|square|sq|park|pkwy|parkway|gate|gardens|garden|heights|hill|landing|manor|common|mews)\b/i;
const PROVINCE_RE = /\b(?:AB|Alberta)\b/i;
const COUNTRY_RE = /\b(?:Canada)\b/i;
const POSTAL_RE = /\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/i;
const QUADRANT_RE = /\b(NE|NW|SE|SW)\b/i;

function cleanPart(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function stripQuadrant(value: string) {
  return cleanPart(value.replace(QUADRANT_RE, ""));
}

function titleCase(value: string) {
  return value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function extractQuadrant(value: string | null | undefined) {
  return value?.toUpperCase().match(/\b(NE|NW|SE|SW)\b/)?.[1] ?? null;
}

export function extractCity(value: string | null | undefined) {
  if (!value) return null;

  const parts = value
    .split(",")
    .map(cleanPart)
    .filter(Boolean)
    .filter((part) => !PROVINCE_RE.test(part))
    .filter((part) => !COUNTRY_RE.test(part))
    .filter((part) => !POSTAL_RE.test(part));

  const candidate = [...parts]
    .reverse()
    .find((part) => !/\d/.test(part) && !STREET_SUFFIX_RE.test(part));

  const cleaned = candidate ? stripQuadrant(candidate) : "";
  return cleaned ? titleCase(cleaned) : null;
}

export function normalizeLocalityCandidate(value: string | null | undefined, city?: string | null) {
  const cleaned = cleanPart(value ?? "");
  if (!cleaned) return null;
  if (POSTAL_RE.test(cleaned)) return null;
  if (PROVINCE_RE.test(cleaned)) return null;
  if (COUNTRY_RE.test(cleaned)) return null;

  const withoutQuadrant = stripQuadrant(cleaned);
  if (city && withoutQuadrant.toLowerCase() === city.toLowerCase()) return null;
  if (/\d/.test(cleaned) && STREET_SUFFIX_RE.test(cleaned)) return null;

  return withoutQuadrant ? titleCase(withoutQuadrant) : null;
}

export function extractNeighborhood(value: string | null | undefined) {
  if (!value) return null;

  const city = extractCity(value);
  const parts = value
    .split(",")
    .map(cleanPart)
    .filter(Boolean)
    .filter((part) => !PROVINCE_RE.test(part))
    .filter((part) => !COUNTRY_RE.test(part))
    .filter((part) => !POSTAL_RE.test(part));

  const candidate = parts.find((part) => {
    if (/\d/.test(part) || STREET_SUFFIX_RE.test(part)) return false;
    const normalized = normalizeLocalityCandidate(part, city);
    return !!normalized;
  });

  return normalizeLocalityCandidate(candidate, city) ?? null;
}

export function neighborhoodSlug(value: string) {
  return sanitizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function normalizeNeighborhoodSlug(value: string) {
  try {
    return neighborhoodSlug(decodeURIComponent(value).replace(/\+/g, " "));
  } catch {
    return neighborhoodSlug(value.replace(/\+/g, " "));
  }
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

export function buildQuoteSignalTitle(service: string, locality: string, city: string) {
  return locality === city
    ? `${service} estimate signal in ${city}`
    : `${service} estimate signal in ${locality}, ${city}`;
}

export function buildQuoteAnchorSlug(service: string, locality: string, city: string, uniqueId: string) {
  return sanitizeText(`${service}-${locality}-${city}-${uniqueId.slice(0, 8)}`);
}

export function resolvePublicLocation(input: {
  neighborhood?: string | null;
  address?: string | null;
  city?: string | null;
  quadrant?: string | null;
}): {
  locality: string;
  city: string;
  quadrant: string | null;
  kind: "neighborhood" | "quadrant" | "city";
  label: string;
  cityQuadrantLabel: string;
} {
  const city = titleCase(stripQuadrant(input.city ?? extractCity(input.address) ?? "Calgary"));
  const neighborhood = normalizeLocalityCandidate(input.neighborhood, city)
    ?? normalizeLocalityCandidate(extractNeighborhood(input.address), city);
  const quadrant = extractQuadrant(input.quadrant ?? input.address) ?? null;
  const locality = neighborhood ?? quadrant ?? city;
  const kind = neighborhood ? "neighborhood" : quadrant ? "quadrant" : "city";
  const label = kind === "neighborhood"
    ? `${locality}, ${city}`
    : kind === "quadrant"
      ? `${quadrant} ${city}`
      : city;

  return {
    locality,
    city,
    quadrant,
    kind,
    label,
    cityQuadrantLabel: quadrant ? `${quadrant} ${city}` : city
  };
}
