import {
  listGeoPosts,
  listProjects,
  listRecentInstaquoteAddressQueries,
  listSolarSuitabilityAnalyses,
} from "./db";
import { quoteMaterialLabel, resolvePublicLocation } from "./serviceAreas";

export type LiveActivityItem = {
  id: string;
  type: "quote" | "project" | "project_update" | "solar";
  service: string;
  location: string;
  message: string;
  occurredAt: string;
  href: string;
};

function titleFromSlug(value: string | null | undefined) {
  if (!value) return "Exterior";
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function sortAndLimit(items: LiveActivityItem[], limit: number) {
  return items
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    )
    .slice(0, limit);
}

export async function getRecentQuoteSignals(
  limit = 20,
): Promise<LiveActivityItem[]> {
  const quoteRows = await listRecentInstaquoteAddressQueries(limit);

  return quoteRows.map((row) => {
    const location = resolvePublicLocation({
      neighborhood: row.neighborhood,
      address: row.address,
    });
    const service = quoteMaterialLabel(row.service_type, row.requested_scopes);

    return {
      id: `quote-${row.id}`,
      type: "quote",
      service,
      location: location.label,
      message: `${service} quote generated in ${location.label}`,
      occurredAt: row.queried_at,
      href: `/quotes#quote-${row.id}`,
    };
  });
}

export async function getRecentRoofingExteriorActivity(
  limit = 20,
): Promise<LiveActivityItem[]> {
  const [projects, projectUpdates, solarAnalyses] = await Promise.all([
    listProjects({ limit: limit * 2, include_unpublished: false }),
    listGeoPosts(limit * 2),
    listSolarSuitabilityAnalyses({
      solar_intent_only: true,
      public_activity_only: true,
      limit: limit * 2,
    }),
  ]);

  const projectItems: LiveActivityItem[] = projects.map((project) => {
    const location = resolvePublicLocation({
      neighborhood: project.neighborhood,
      city: project.city,
      quadrant: project.quadrant,
    });
    const service = titleFromSlug(project.service_slug);

    return {
      id: `project-${project.id}`,
      type: "project",
      service,
      location: location.label,
      message: `New ${service.toLowerCase()} project completed in ${location.label}`,
      occurredAt: project.created_at,
      href: `/projects/${project.slug}`,
    };
  });

  const projectUpdateItems: LiveActivityItem[] = projectUpdates.map((update) => {
    const location = resolvePublicLocation({
      neighborhood: update.neighborhood,
      city: update.city,
      address: null,
    });
    const service = titleFromSlug(update.service_slug);

    return {
      id: `project-update-${update.id}`,
      type: "project_update",
      service,
      location: location.label,
      message: `New ${service.toLowerCase()} update from ${location.label}`,
      occurredAt: update.created_at,
      href: update.service_slug ? `/services/${update.service_slug}` : "/services",
    };
  });

  const solarItems: LiveActivityItem[] = solarAnalyses.map((solar) => ({
    id: `solar-${solar.id}`,
    type: "solar",
    service: "Solar suitability",
    location:
      solar.city === "Calgary"
        ? `${solar.neighborhood}, Calgary`
        : `${solar.neighborhood}, ${solar.city}`,
    message: `Solar suitability request modeled in ${solar.neighborhood}`,
    occurredAt: solar.created_at,
    href: "/solar-suitability",
  }));

  return sortAndLimit(
    [...projectItems, ...projectUpdateItems, ...solarItems],
    limit,
  );
}
