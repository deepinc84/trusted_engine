import type { Project } from "./db";

export function getCarouselImage(project: Project) {
  return project.images[0] ?? "";
}

export function getProjectGallery(project: Project) {
  return project.images;
}

// TODO: plug in Geo-Boost legacy scoring and ranking engine.
export function scoreProjectForGeoBoost(project: Project) {
  return {
    slug: project.slug,
    city: project.city,
    neighborhood: project.neighborhood,
    score: 1
  };
}
