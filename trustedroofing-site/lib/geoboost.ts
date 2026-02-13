import type { Project } from "./db";

export function getCarouselImage(project: Project) {
  return project.photos?.[0]?.public_url ?? "";
}

export function getProjectGallery(project: Project) {
  return (project.photos ?? []).map((photo) => photo.public_url);
}

// TODO: plug in Geo-Boost legacy scoring and ranking engine.
export function scoreProjectForGeoBoost(project: Project) {
  return {
    id: project.id,
    slug: project.slug,
    city: project.city,
    neighborhood: project.neighborhood,
    score: 1
  };
}
