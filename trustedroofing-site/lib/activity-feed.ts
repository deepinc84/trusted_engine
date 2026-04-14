import { listGeoPosts, listProjects, listRecentInstaquoteAddressQueries } from "./db";
import { quoteMaterialLabel, resolvePublicLocation } from "./serviceAreas";

export type LiveActivityItem = {
  id: string;
  type: "quote" | "project" | "geo_post";
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

export async function getLiveActivityFeed(limit = 20): Promise<LiveActivityItem[]> {
  const [quoteRows, projects, geoPosts] = await Promise.all([
    listRecentInstaquoteAddressQueries(limit * 2),
    listProjects({ limit: limit * 2, include_unpublished: false }),
    listGeoPosts(limit * 2)
  ]);

  const quoteItems: LiveActivityItem[] = quoteRows.map((row) => {
    const location = resolvePublicLocation({
      neighborhood: row.neighborhood,
      address: row.address
    });
    const service = quoteMaterialLabel(row.service_type, row.requested_scopes);

    return {
      id: `quote-${row.id}`,
      type: "quote",
      service,
      location: location.label,
      message: `${service} quote generated in ${location.label}`,
      occurredAt: row.queried_at,
      href: `/quotes#quote-${row.id}`
    };
  });

  const projectItems: LiveActivityItem[] = projects.map((project) => {
    const location = resolvePublicLocation({
      neighborhood: project.neighborhood,
      city: project.city,
      quadrant: project.quadrant
    });
    const service = titleFromSlug(project.service_slug);
    const occurredAt = project.created_at;

    return {
      id: `project-${project.id}`,
      type: "project",
      service,
      location: location.label,
      message: `New ${service.toLowerCase()} project completed in ${location.label}`,
      occurredAt,
      href: `/projects/${project.slug}`
    };
  });

  const geoPostItems: LiveActivityItem[] = geoPosts.map((geoPost) => {
    const location = resolvePublicLocation({
      neighborhood: geoPost.neighborhood,
      city: geoPost.city,
      address: null
    });
    const service = titleFromSlug(geoPost.service_slug);

    return {
      id: `geo-${geoPost.id}`,
      type: "geo_post",
      service,
      location: location.label,
      message: `${service} project published in ${location.label}`,
      occurredAt: geoPost.created_at,
      href: geoPost.slug ? `/geo-posts/${geoPost.slug}` : "/projects"
    };
  });

  return [...quoteItems, ...projectItems, ...geoPostItems]
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, limit);
}
