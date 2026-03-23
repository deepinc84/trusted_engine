type PlaceholderImageInput = string | {
  seed: string;
  neighborhood?: string | null;
  quadrant?: string | null;
  city?: string | null;
};

const placeholderImages = [
  "/projects/project-1.svg",
  "/projects/project-2.svg",
  "/projects/project-3.svg"
] as const;

const southeastNeighborhoods = new Set([
  "auburn bay",
  "cranston",
  "legacy",
  "mahogany",
  "seton",
  "mckenzie towne",
  "new brighton",
  "copperfield"
]);

const innerCityNeighborhoods = new Set([
  "bridgeland",
  "renfrew",
  "inglewood",
  "kensington",
  "crescent heights",
  "mount pleasant",
  "sunnyside"
]);

function normalize(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function hashPlaceholderIndex(seed: string) {
  return Math.abs(seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % placeholderImages.length;
}

export function getPlaceholderProjectImage(input: PlaceholderImageInput) {
  const context = typeof input === "string" ? { seed: input } : input;
  const neighborhood = normalize(context.neighborhood);
  const quadrant = normalize(context.quadrant);
  const city = normalize(context.city);

  if (quadrant === "se" || southeastNeighborhoods.has(neighborhood)) {
    return placeholderImages[1];
  }

  if (quadrant === "ne" || quadrant === "nw" || innerCityNeighborhoods.has(neighborhood)) {
    return placeholderImages[2];
  }

  if (city && city !== "calgary") {
    return placeholderImages[hashPlaceholderIndex(`${city}-${context.seed}`)];
  }

  return placeholderImages[hashPlaceholderIndex(context.seed)];
}
