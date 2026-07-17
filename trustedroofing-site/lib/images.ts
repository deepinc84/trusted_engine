import type { Project, ProjectPhoto } from "./db";

type PlaceholderImageInput =
  | string
  | {
      seed: string;
      neighborhood?: string | null;
      quadrant?: string | null;
      city?: string | null;
    };

const placeholderImages = [
  "/projects/project-1.svg",
  "/projects/project-2.svg",
  "/projects/project-3.svg",
] as const;

const southeastNeighborhoods = new Set([
  "auburn bay",
  "cranston",
  "legacy",
  "mahogany",
  "seton",
  "mckenzie towne",
  "new brighton",
  "copperfield",
]);

const innerCityNeighborhoods = new Set([
  "bridgeland",
  "renfrew",
  "inglewood",
  "kensington",
  "crescent heights",
  "mount pleasant",
  "sunnyside",
]);

function normalize(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function hashPlaceholderIndex(seed: string) {
  return (
    Math.abs(
      seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0),
    ) % placeholderImages.length
  );
}

export function getPlaceholderProjectImage(input: PlaceholderImageInput) {
  const context = typeof input === "string" ? { seed: input } : input;
  const neighborhood = normalize(context.neighborhood);
  const quadrant = normalize(context.quadrant);
  const city = normalize(context.city);

  if (quadrant === "se" || southeastNeighborhoods.has(neighborhood)) {
    return placeholderImages[1];
  }

  if (
    quadrant === "ne" ||
    quadrant === "nw" ||
    innerCityNeighborhoods.has(neighborhood)
  ) {
    return placeholderImages[2];
  }

  if (city && city !== "calgary") {
    return placeholderImages[hashPlaceholderIndex(`${city}-${context.seed}`)];
  }

  return placeholderImages[hashPlaceholderIndex(context.seed)];
}

const HERO_STAGE_ORDER = ["after", "installation", "tear_off_prep"] as const;
type HeroStage = (typeof HERO_STAGE_ORDER)[number];

const heroStagePriority: Record<HeroStage, number> = {
  after: 0,
  installation: 1,
  tear_off_prep: 2,
};

function inferHeroStageFromText(value: string): HeroStage | null {
  const normalized = value.toLowerCase();
  if (normalized.includes("before") || normalized.includes("issue")) return null;
  if (normalized.includes("after")) return "after";
  if (normalized.includes("install")) return "installation";
  if (normalized.includes("tear") || normalized.includes("prep")) return "tear_off_prep";
  return null;
}

function resolveHeroStage(photo: ProjectPhoto): HeroStage | null {
  if (photo.stage && HERO_STAGE_ORDER.includes(photo.stage as HeroStage)) {
    return photo.stage as HeroStage;
  }

  return inferHeroStageFromText(
    `${photo.caption ?? ""} ${photo.description ?? ""} ${photo.file_name ?? ""}`,
  );
}

/** Selects an after, installation, or prep photo for heroes; before photos are never heroes. */
export function selectHeroProjectPhoto(
  photos: ProjectPhoto[] | null | undefined,
): ProjectPhoto | null {
  return (
    [...(photos ?? [])]
      .map((photo) => ({ photo, heroStage: resolveHeroStage(photo) }))
      .filter((entry): entry is { photo: ProjectPhoto; heroStage: HeroStage } =>
        entry.heroStage !== null,
      )
      .sort(
        (a, b) =>
          heroStagePriority[a.heroStage] - heroStagePriority[b.heroStage] ||
          Number(b.photo.is_primary) - Number(a.photo.is_primary) ||
          Number(
            b.photo.width !== null &&
              b.photo.height !== null &&
              b.photo.width > b.photo.height,
          ) -
            Number(
              a.photo.width !== null &&
                a.photo.height !== null &&
                a.photo.width > a.photo.height,
            ) ||
          a.photo.sort_order - b.photo.sort_order,
      )[0]?.photo ?? null
  );
}

export function selectHeroProjectImage(
  projects: Project[] | null | undefined,
): string | null {
  for (const project of projects ?? []) {
    const photo = selectHeroProjectPhoto(project.photos);
    if (photo) return photo.public_url;
  }
  return null;
}
