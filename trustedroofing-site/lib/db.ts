import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { haversineKm } from "./geo";
import { roundLatLng, sanitizeText } from "./sanitize";

export type Service = {
  id: string;
  slug: string;
  title: string;
  base_sales_copy: string | null;
  created_at: string;
};

export type ProjectPhoto = {
  id: string;
  project_id: string;
  storage_provider: string | null;
  storage_bucket: string | null;
  storage_path: string;
  public_url: string;
  file_size: number | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  caption: string | null;
  sort_order: number;
  is_primary: boolean;
  address_private: string | null;
  lat_private: number | null;
  lng_private: number | null;
  lat_public: number | null;
  lng_public: number | null;
  geocode_source: string | null;
  blurhash: string | null;
  created_at: string;
};


export type HomepageMetric = {
  id: string;
  key_name: string;
  label: string;
  value_text: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type ServiceArea = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  sort_order: number;
  created_at: string;
};
export type Project = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string | null;
  service_slug: string;
  city: string;
  province: string;
  neighborhood: string | null;
  quadrant: string | null;
  address_private: string | null;
  place_id: string | null;
  geocode_source: string | null;
  lat_private: number | null;
  lng_private: number | null;
  lat_public: number | null;
  lng_public: number | null;
  completed_at: string | null;
  created_at: string;
  is_published: boolean;
  photos?: ProjectPhoto[];
};

export type GeoPost = {
  id: string;
  project_id: string;
  slug: string | null;
  title: string | null;
  summary: string | null;
  service_slug: string | null;
  city: string | null;
  province: string | null;
  neighborhood: string | null;
  lat_public: number | null;
  lng_public: number | null;
  primary_image_url: string | null;
  images?: string[] | null;
  created_at: string;
};

export type ProjectImageSet = {
  primaryImage: ProjectPhoto | null;
  gallery: ProjectPhoto[];
};

export type ResolvedGeoPost = GeoPost & {
  heroImage: string | null;
  gallery: string[];
};

type QuoteEventStep1 = {
  service_slug: string | null;
  place_id: string | null;
  address_private: string | null;
  lat_private: number | null;
  lng_private: number | null;
  lat_public: number | null;
  lng_public: number | null;
  estimate_low: number | null;
  estimate_high: number | null;
  status: string;
};

const isSupabaseEnabled =
  !!(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL) &&
  !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY);

const defaultServices: Service[] = [
  {
    id: "seed-roofing",
    slug: "roofing",
    title: "Roofing",
    base_sales_copy: "Full roof replacements and high-performance installs.",
    created_at: new Date().toISOString()
  },
  {
    id: "seed-roof-repair",
    slug: "roof-repair",
    title: "Roof Repair",
    base_sales_copy: "Leak repairs, storm response, and targeted fixes.",
    created_at: new Date().toISOString()
  },
  {
    id: "seed-siding",
    slug: "siding",
    title: "Siding",
    base_sales_copy: "Vinyl and Hardie siding upgrades with clean detailing.",
    created_at: new Date().toISOString()
  },
  {
    id: "seed-gutters",
    slug: "gutters",
    title: "Gutters",
    base_sales_copy: "Eavestrough and drainage system replacements.",
    created_at: new Date().toISOString()
  },
  {
    id: "seed-soffit-fascia",
    slug: "soffit-fascia",
    title: "Soffit & Fascia",
    base_sales_copy: "Ventilation-safe soffit and fascia renewal.",
    created_at: new Date().toISOString()
  }
];

const mockServices = [...defaultServices];
const mockProjects: Project[] = [];
const mockProjectPhotos: ProjectPhoto[] = [];
const mockGeoPosts: GeoPost[] = [];
const mockQuoteEvents: Array<{ id: string; created_at: string } & QuoteEventStep1> = [];
const mockQuoteContacts: Array<{
  quote_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  preferred_contact: string | null;
  created_at: string;
}> = [];
const defaultHomepageMetrics: HomepageMetric[] = [
  { id: "metric-homes", key_name: "homes_served", label: "Calgary homes served", value_text: "500+", sort_order: 1, is_active: true, created_at: new Date().toISOString() },
  { id: "metric-turnaround", key_name: "avg_quote_turnaround", label: "Average estimate turnaround", value_text: "48hr", sort_order: 2, is_active: true, created_at: new Date().toISOString() },
  { id: "metric-warranty", key_name: "workmanship_warranty", label: "Workmanship warranty", value_text: "10yr", sort_order: 3, is_active: true, created_at: new Date().toISOString() },
  { id: "metric-financing", key_name: "financing_label", label: "Financing available", value_text: "100%", sort_order: 4, is_active: true, created_at: new Date().toISOString() },
  { id: "metric-insurance", key_name: "insurance_status", label: "Insured & licensed", value_text: "A+", sort_order: 5, is_active: true, created_at: new Date().toISOString() }
];

const defaultServiceAreas: ServiceArea[] = [
  "Mahogany", "Auburn Bay", "Cranston", "Seton", "Altadore", "Marda Loop", "Evergreen", "Legacy"
].map((name, index) => ({
  id: `area-${index + 1}`,
  name,
  slug: sanitizeText(name),
  active: true,
  sort_order: index + 1,
  created_at: new Date().toISOString()
}));

const mockHomepageMetrics = [...defaultHomepageMetrics];
const mockServiceAreas = [...defaultServiceAreas];

const mockGbpQueue: Array<{
  id: string;
  created_at: string;
  status: "pending" | "sent" | "failed";
  project_id: string;
  payload: Record<string, unknown>;
  last_error: string | null;
  attempts: number;
}> = [];

let anonClient: SupabaseClient | null = null;
let serviceClient: SupabaseClient | null = null;

export function getDataMode(): "supabase" | "mock" {
  return isSupabaseEnabled ? "supabase" : "mock";
}

function getAnonClient() {
  if (!isSupabaseEnabled) return null;
  if (!anonClient) {
    anonClient = createClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL) as string,
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY) as string
    );
  }
  return anonClient;
}

function getServiceClient() {
  if (!isSupabaseEnabled || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  if (!serviceClient) {
    serviceClient = createClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL) as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return serviceClient;
}

function sortProjectPhotos(photos: ProjectPhoto[]) {
  return [...photos].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order);
}

function buildProjectImageSet(photos: ProjectPhoto[]): ProjectImageSet {
  const gallery = sortProjectPhotos(photos);
  return {
    primaryImage: gallery[0] ?? null,
    gallery
  };
}

function buildProjectImageSetMap(projectIds: string[], photos: ProjectPhoto[]) {
  const grouped = new Map<string, ProjectPhoto[]>();

  for (const projectId of projectIds) {
    grouped.set(projectId, []);
  }

  for (const photo of photos) {
    const existing = grouped.get(photo.project_id) ?? [];
    existing.push(photo);
    grouped.set(photo.project_id, existing);
  }

  return new Map(
    projectIds.map((projectId) => [projectId, buildProjectImageSet(grouped.get(projectId) ?? [])])
  );
}

async function fetchPhotosByProjectIds(projectIds: string[], clientOverride?: SupabaseClient | null) {
  const client = clientOverride ?? getServiceClient() ?? getAnonClient();
  if (!client || projectIds.length === 0) return [] as ProjectPhoto[];

  const { data } = await client
    .from("project_photos")
    .select("*")
    .in("project_id", projectIds)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true });

  return (data ?? []) as ProjectPhoto[];
}

export async function probeDataRead(): Promise<{ ok: boolean; error: string | null }> {
  if (getDataMode() === "mock") return { ok: true, error: null };

  try {
    const client = getAnonClient();
    if (!client) return { ok: false, error: "Supabase client unavailable." };
    const { error } = await client.from("projects").select("id").limit(1);
    return { ok: !error, error: error?.message ?? null };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}


async function resolveUniqueSlug(baseSlug: string, ignoreProjectId?: string) {
  const normalizedBase = sanitizeText(baseSlug);

  if (getDataMode() === "supabase") {
    const client = getServiceClient() ?? getAnonClient();
    if (!client) return normalizedBase;

    const { data, error } = await client
      .from("projects")
      .select("id, slug")
      .ilike("slug", `${normalizedBase}%`);

    if (error || !data?.length) return normalizedBase;

    const existing = data
      .filter((row) => row.id !== ignoreProjectId)
      .map((row) => String(row.slug));

    if (!existing.includes(normalizedBase)) return normalizedBase;

    let suffix = 2;
    while (existing.includes(`${normalizedBase}-${suffix}`)) {
      suffix += 1;
    }

    return `${normalizedBase}-${suffix}`;
  }

  const existing = mockProjects
    .filter((project) => project.id !== ignoreProjectId)
    .map((project) => project.slug);

  if (!existing.includes(normalizedBase)) return normalizedBase;

  let suffix = 2;
  while (existing.includes(`${normalizedBase}-${suffix}`)) {
    suffix += 1;
  }
  return `${normalizedBase}-${suffix}`;
}

async function seedServicesIfEmpty(client: SupabaseClient) {
  const { count } = await client
    .from("services")
    .select("id", { count: "exact", head: true });

  if ((count ?? 0) > 0) return;

  const payload = defaultServices.map(({ slug, title, base_sales_copy }) => ({
    slug,
    title,
    base_sales_copy
  }));

  await client.from("services").insert(payload);
}

export async function listServices(): Promise<Service[]> {
  if (getDataMode() === "supabase") {
    const client = getAnonClient();
    if (client) {
      const serviceAdmin = getServiceClient();
      if (serviceAdmin) {
        await seedServicesIfEmpty(serviceAdmin);
      }

      const { data } = await client.from("services").select("*").order("title");
      return (data ?? []) as Service[];
    }
  }

  return [...mockServices].sort((a, b) => a.title.localeCompare(b.title));
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  if (getDataMode() === "supabase") {
    const client = getAnonClient();
    if (client) {
      const { data } = await client.from("services").select("*").eq("slug", slug).maybeSingle();
      return (data as Service | null) ?? null;
    }
  }

  return mockServices.find((service) => service.slug === slug) ?? null;
}

export async function listProjects(filters?: {
  service_slug?: string | null;
  neighborhood?: string | null;
  limit?: number | null;
  near_lat?: number | null;
  near_lng?: number | null;
  include_unpublished?: boolean;
}): Promise<Project[]> {
  const includeUnpublished = !!filters?.include_unpublished;

  if (getDataMode() === "supabase") {
    const client = getAnonClient();
    if (client) {
      let query = client.from("projects").select("*");
      if (!includeUnpublished) query = query.eq("is_published", true);
      if (filters?.service_slug) query = query.eq("service_slug", filters.service_slug);
      if (filters?.neighborhood) query = query.eq("neighborhood", filters.neighborhood);
      if (filters?.limit) query = query.limit(filters.limit);
      query = query.order("completed_at", { ascending: false, nullsFirst: false });

      const { data } = await query;
      const projects = (data ?? []) as Project[];
      const imageSets = await getProjectImageSets(projects.map((project) => project.id));

      let output = projects.map((project) => ({
        ...project,
        photos: imageSets.get(project.id)?.gallery ?? []
      }));

      if (filters?.near_lat !== null && filters?.near_lat !== undefined && filters?.near_lng !== null && filters?.near_lng !== undefined) {
        output = output
          .map((project) => ({
            project,
            distance:
              project.lat_public !== null && project.lng_public !== null
                ? haversineKm(filters.near_lat as number, filters.near_lng as number, project.lat_public, project.lng_public)
                : Number.MAX_SAFE_INTEGER
          }))
          .sort((a, b) => a.distance - b.distance)
          .map((entry) => entry.project);
      }

      return output;
    }
  }

  let output = [...mockProjects];
  if (!includeUnpublished) output = output.filter((project) => project.is_published);
  if (filters?.service_slug) output = output.filter((project) => project.service_slug === filters.service_slug);
  if (filters?.neighborhood) output = output.filter((project) => project.neighborhood === filters.neighborhood);

  if (filters?.near_lat !== null && filters?.near_lat !== undefined && filters?.near_lng !== null && filters?.near_lng !== undefined) {
    output = output
      .map((project) => ({
        project,
        distance:
          project.lat_public !== null && project.lng_public !== null
            ? haversineKm(filters.near_lat as number, filters.near_lng as number, project.lat_public, project.lng_public)
            : Number.MAX_SAFE_INTEGER
      }))
      .sort((a, b) => a.distance - b.distance)
      .map((entry) => entry.project);
  }

  const imageSets = await getProjectImageSets(output.map((project) => project.id));

  output = output.map((project) => ({
    ...project,
    photos: imageSets.get(project.id)?.gallery ?? []
  }));

  if (filters?.limit) output = output.slice(0, filters.limit);
  return output;
}

export async function getProjectImageSets(projectIds: string[]): Promise<Map<string, ProjectImageSet>> {
  if (projectIds.length === 0) return new Map();

  if (getDataMode() === "supabase") {
    const photos = await fetchPhotosByProjectIds(projectIds);
    return buildProjectImageSetMap(projectIds, photos);
  }

  const photos = mockProjectPhotos.filter((photo) => projectIds.includes(photo.project_id));
  return buildProjectImageSetMap(projectIds, photos);
}

export async function getProjectImageSet(projectId: string): Promise<ProjectImageSet> {
  const imageSets = await getProjectImageSets([projectId]);
  return imageSets.get(projectId) ?? { primaryImage: null, gallery: [] };
}

export async function getProjectBySlug(slug: string, includeUnpublished = false): Promise<Project | null> {
  const list = await listProjects({ include_unpublished: includeUnpublished });
  return list.find((project) => project.slug === slug) ?? null;
}

export async function getProjectById(id: string): Promise<Project | null> {
  if (getDataMode() === "supabase") {
    const client = getServiceClient() ?? getAnonClient();
    if (client) {
      const { data } = await client.from("projects").select("*").eq("id", id).maybeSingle();
      if (!data) return null;
      const imageSet = await getProjectImageSet(id);
      return { ...(data as Project), photos: imageSet.gallery };
    }
  }

  const project = mockProjects.find((item) => item.id === id);
  if (!project) return null;
  const imageSet = await getProjectImageSet(id);

  return {
    ...project,
    photos: imageSet.gallery
  };
}

export async function listGeoPosts(): Promise<ResolvedGeoPost[]> {
  const resolveGeoPosts = async (geoPosts: GeoPost[]) => {
    const imageSets = await getProjectImageSets(geoPosts.map((geoPost) => geoPost.project_id));

    return geoPosts.map((geoPost) => {
      const ownGallery = Array.isArray(geoPost.images)
        ? geoPost.images.filter((image): image is string => typeof image === "string" && image.length > 0)
        : [];

      if (ownGallery.length > 0) {
        return {
          ...geoPost,
          heroImage: ownGallery[0],
          gallery: ownGallery
        } satisfies ResolvedGeoPost;
      }

      const imageSet = imageSets.get(geoPost.project_id) ?? { primaryImage: null, gallery: [] };
      const projectGallery = imageSet.gallery.map((photo) => photo.public_url);

      return {
        ...geoPost,
        heroImage: geoPost.primary_image_url ?? imageSet.primaryImage?.public_url ?? null,
        gallery: projectGallery
      } satisfies ResolvedGeoPost;
    });
  };

  if (getDataMode() === "supabase") {
    const client = getAnonClient();
    if (client) {
      const { data } = await client
        .from("geo_posts")
        .select("*")
        .order("created_at", { ascending: false });

      const geoPosts = ((data ?? []) as GeoPost[]).filter((geoPost) => !!geoPost.slug);
      return resolveGeoPosts(geoPosts);
    }
  }

  return resolveGeoPosts(mockGeoPosts.filter((geoPost) => !!geoPost.slug));
}

export async function getGeoPostBySlug(slug: string): Promise<ResolvedGeoPost | null> {
  const geoPosts = await listGeoPosts();
  return geoPosts.find((geoPost) => geoPost.slug === slug) ?? null;
}

type ProjectInput = {
  slug: string;
  title: string;
  summary: string;
  description?: string | null;
  service_slug: string;
  city?: string;
  province?: string;
  neighborhood?: string | null;
  quadrant?: string | null;
  address_private?: string | null;
  place_id?: string | null;
  geocode_source?: string | null;
  lat_private?: number | null;
  lng_private?: number | null;
  completed_at?: string | null;
  is_published?: boolean;
};

function toProjectPayload(data: ProjectInput) {
  const rounded = roundLatLng(data.lat_private ?? null, data.lng_private ?? null, 3);

  return {
    slug: sanitizeText(data.slug),
    title: sanitizeText(data.title),
    summary: sanitizeText(data.summary),
    description: data.description ? sanitizeText(data.description) : null,
    service_slug: data.service_slug,
    city: data.city ?? "Calgary",
    province: data.province ?? "AB",
    neighborhood: data.neighborhood ?? null,
    quadrant: data.quadrant ?? null,
    address_private: data.address_private ? sanitizeText(data.address_private) : null,
    place_id: data.place_id ? sanitizeText(data.place_id) : null,
    geocode_source: data.geocode_source ?? null,
    lat_private: data.lat_private ?? null,
    lng_private: data.lng_private ?? null,
    lat_public: rounded.lat,
    lng_public: rounded.lng,
    completed_at: data.completed_at ?? null,
    is_published: data.is_published ?? true
  };
}

export async function createProject(data: ProjectInput) {
  const payload = toProjectPayload(data);
  payload.slug = await resolveUniqueSlug(payload.slug);

  if (getDataMode() === "supabase") {
    const client = getServiceClient();
    if (!client) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin writes.");
    const { data: created, error } = await client
      .from("projects")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return created as Project;
  }

  const project: Project = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    ...payload,
    photos: []
  };

  mockProjects.unshift(project);
  return project;
}

export async function updateProject(id: string, data: Partial<ProjectInput>) {
  const partialPayload = toProjectPayload({
    slug: data.slug ?? "",
    title: data.title ?? "",
    summary: data.summary ?? "",
    description: data.description,
    service_slug: data.service_slug ?? "roofing",
    city: data.city,
    province: data.province,
    neighborhood: data.neighborhood,
    quadrant: data.quadrant,
    address_private: data.address_private,
    place_id: data.place_id,
    geocode_source: data.geocode_source,
    lat_private: data.lat_private,
    lng_private: data.lng_private,
    completed_at: data.completed_at,
    is_published: data.is_published
  });

  const payload = Object.fromEntries(
    Object.entries(partialPayload).filter(([_, value]) => value !== "")
  ) as Partial<ReturnType<typeof toProjectPayload>>;

  if (typeof payload.slug === "string" && payload.slug.length > 0) {
    payload.slug = await resolveUniqueSlug(payload.slug, id);
  }

  if (getDataMode() === "supabase") {
    const client = getServiceClient();
    if (!client) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin writes.");
    const { data: updated, error } = await client
      .from("projects")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return updated as Project;
  }

  const existing = mockProjects.find((project) => project.id === id);
  if (!existing) throw new Error("Project not found");
  Object.assign(existing, payload);
  return existing;
}

export async function addProjectPhoto(
  project_id: string,
  photo: {
    storage_provider?: string | null;
    storage_bucket?: string | null;
    storage_path: string;
    public_url: string;
    file_size?: number | null;
    mime_type?: string | null;
    width?: number | null;
    height?: number | null;
    caption?: string | null;
    sort_order?: number;
    is_primary?: boolean;
    address_private?: string | null;
    lat_private?: number | null;
    lng_private?: number | null;
    geocode_source?: string | null;
    blurhash?: string | null;
  }
) {
  const rounded = roundLatLng(photo.lat_private ?? null, photo.lng_private ?? null, 3);

  const payload = {
    project_id,
    storage_provider: photo.storage_provider ?? null,
    storage_bucket: photo.storage_bucket ?? null,
    storage_path: photo.storage_path,
    public_url: photo.public_url,
    file_size: photo.file_size ?? null,
    mime_type: photo.mime_type ?? null,
    width: photo.width ?? null,
    height: photo.height ?? null,
    caption: photo.caption ?? null,
    sort_order: photo.sort_order ?? 0,
    is_primary: photo.is_primary ?? false,
    address_private: photo.address_private ?? null,
    lat_private: photo.lat_private ?? null,
    lng_private: photo.lng_private ?? null,
    lat_public: rounded.lat,
    lng_public: rounded.lng,
    geocode_source: photo.geocode_source ?? null,
    blurhash: photo.blurhash ?? null
  };

  if (getDataMode() === "supabase") {
    const client = getServiceClient();
    if (!client) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin writes.");
    const { data, error } = await client
      .from("project_photos")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data as ProjectPhoto;
  }

  const created: ProjectPhoto = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    ...payload
  };
  mockProjectPhotos.push(created);
  return created;
}


export async function setPrimaryProjectPhoto(projectId: string, photoId: string) {
  if (getDataMode() === "supabase") {
    const client = getServiceClient();
    if (!client) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin writes.");

    const { error: clearError } = await client
      .from("project_photos")
      .update({ is_primary: false })
      .eq("project_id", projectId);
    if (clearError) throw new Error(clearError.message);

    const { error: primaryError } = await client
      .from("project_photos")
      .update({ is_primary: true })
      .eq("id", photoId)
      .eq("project_id", projectId);
    if (primaryError) throw new Error(primaryError.message);
    return true;
  }

  for (const photo of mockProjectPhotos) {
    if (photo.project_id === projectId) photo.is_primary = photo.id === photoId;
  }

  return true;
}

export async function syncGeoPostForProject(projectId: string) {
  const project = await getProjectById(projectId);
  if (!project) throw new Error("Project not found for geo_post sync.");

  const imageSet = await getProjectImageSet(projectId);
  const primaryImage = imageSet.primaryImage?.public_url ?? null;

  const payload = {
    project_id: project.id,
    slug: project.slug,
    title: project.title,
    summary: project.summary,
    service_slug: project.service_slug,
    city: project.city,
    province: project.province,
    neighborhood: project.neighborhood,
    lat_public: project.lat_public,
    lng_public: project.lng_public,
    primary_image_url: primaryImage
  };

  const uniqueConstraintHint = "Run migration 0008_geo_posts_project_unique.sql.";

  if (getDataMode() === "supabase") {
    const client = getServiceClient();
    if (!client) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for geo_post writes.");

    const { data, error } = await client
      .from("geo_posts")
      .upsert(payload, { onConflict: "project_id" })
      .select("*")
      .single();

    if (!error) return data as GeoPost;

    if (error.message.includes("no unique or exclusion constraint matching the ON CONFLICT specification")) {
      const { data: existingRows, error: readError } = await client
        .from("geo_posts")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: true });

      if (readError) {
        throw new Error(`geo_posts read failed: ${readError.message}. ${uniqueConstraintHint}`);
      }

      const existing = (existingRows ?? []) as GeoPost[];

      if (existing.length > 0) {
        const { data: updated, error: updateError } = await client
          .from("geo_posts")
          .update(payload)
          .eq("id", existing[0].id)
          .select("*")
          .single();

        if (updateError) {
          throw new Error(`geo_posts update failed: ${updateError.message}. ${uniqueConstraintHint}`);
        }

        if (existing.length > 1) {
          const duplicateIds = existing.slice(1).map((row) => row.id);
          await client.from("geo_posts").delete().in("id", duplicateIds);
        }

        return updated as GeoPost;
      }

      const { data: inserted, error: insertError } = await client
        .from("geo_posts")
        .insert(payload)
        .select("*")
        .single();

      if (insertError) {
        throw new Error(`geo_posts insert failed: ${insertError.message}. ${uniqueConstraintHint}`);
      }

      return inserted as GeoPost;
    }

    throw new Error(`geo_posts upsert failed: ${error.message}`);
  }

  const existingIndex = mockGeoPosts.findIndex((row) => row.project_id === project.id);
  const base: GeoPost = {
    id: existingIndex >= 0 ? mockGeoPosts[existingIndex].id : crypto.randomUUID(),
    created_at: existingIndex >= 0 ? mockGeoPosts[existingIndex].created_at : new Date().toISOString(),
    ...payload
  };

  if (existingIndex >= 0) {
    mockGeoPosts[existingIndex] = base;
  } else {
    mockGeoPosts.push(base);
  }

  return base;
}

export async function enqueueGbpPost(project_id: string, payload: Record<string, unknown>) {
  if (getDataMode() === "supabase") {
    const client = getServiceClient();
    if (!client) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin writes.");
    const { error } = await client.from("gbp_post_queue").insert({
      project_id,
      payload,
      status: "pending",
      attempts: 0,
      last_error: null
    });

    if (error) throw new Error(error.message);
    return true;
  }

  mockGbpQueue.push({
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    project_id,
    payload,
    status: "pending",
    attempts: 0,
    last_error: null
  });

  return true;
}

export async function listPendingGbpPosts(limit = 25) {
  if (getDataMode() === "supabase") {
    const client = getServiceClient();
    if (!client) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for worker writes.");
    const { data, error } = await client
      .from("gbp_post_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  return mockGbpQueue.filter((row) => row.status === "pending").slice(0, limit);
}

export async function markGbpQueueStatus(id: string, status: "sent" | "failed", errorMessage?: string) {
  if (getDataMode() === "supabase") {
    const client = getServiceClient();
    if (!client) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for worker writes.");
    const { error } = await client
      .from("gbp_post_queue")
      .update({
        status,
        last_error: errorMessage ?? null,
        attempts: (status === "failed" ? 1 : 0)
      })
      .eq("id", id);

    if (error) throw new Error(error.message);
    return;
  }

  const item = mockGbpQueue.find((row) => row.id === id);
  if (!item) return;
  item.status = status;
  item.last_error = errorMessage ?? null;
  item.attempts += 1;
}

export async function createQuoteStep1(input: QuoteEventStep1) {
  const payload = {
    ...input,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString()
  };

  if (getDataMode() === "supabase") {
    const client = getServiceClient() ?? getAnonClient();
    if (!client) throw new Error("Supabase client unavailable");
    const { error } = await client.from("quote_events").insert(payload);
    if (error) throw new Error(error.message);
    return payload.id;
  }

  mockQuoteEvents.push(payload);
  return payload.id;
}

export async function updateQuoteStep2(input: {
  quote_id: string;
  name: string;
  email: string;
  phone: string;
  preferred_contact: string;
}) {
  const payload = {
    quote_id: input.quote_id,
    name: input.name || null,
    email: input.email || null,
    phone: input.phone || null,
    preferred_contact: input.preferred_contact || null,
    created_at: new Date().toISOString()
  };

  if (getDataMode() === "supabase") {
    const client = getServiceClient() ?? getAnonClient();
    if (!client) throw new Error("Supabase client unavailable");
    const { error } = await client.from("quote_contacts").insert(payload);
    if (error) throw new Error(error.message);
    await client.from("quote_events").update({ status: "step2" }).eq("id", input.quote_id);
    return true;
  }

  mockQuoteContacts.push(payload);
  const event = mockQuoteEvents.find((item) => item.id === input.quote_id);
  if (event) event.status = "step2";
  return true;
}

export function getStorageAdminClient() {
  return getServiceClient();
}

export type InstaquoteAddressQuery = {
  id: string;
  address: string;
  neighborhood: string | null;
  service_type: string | null;
  requested_scopes: string[] | null;
  place_id: string | null;
  lat: number | null;
  lng: number | null;
  roof_area_sqft: number | null;
  pitch_degrees: number | null;
  complexity_band: string | null;
  area_source: string | null;
  data_source: string | null;
  estimate_low: number | null;
  estimate_high: number | null;
  solar_status: string | null;
  solar_debug: Record<string, unknown> | null;
  queried_at: string;
};

export type InstaquoteLead = {
  id: string;
  address_query_id: string | null;
  address: string;
  place_id: string | null;
  lat: number | null;
  lng: number | null;
  name: string;
  email: string;
  phone: string;
  budget_response: "yes" | "financing" | "too_expensive";
  timeline: string | null;
  roof_area_sqft: number | null;
  roof_squares: number | null;
  pitch: string | null;
  good_low: number | null;
  good_high: number | null;
  better_low: number | null;
  better_high: number | null;
  best_low: number | null;
  best_high: number | null;
  eaves_low: number | null;
  eaves_high: number | null;
  siding_low: number | null;
  siding_high: number | null;
  lead_score: number | null;
  lead_grade: string | null;
  data_source: string | null;
  source: string;
  email_sent: boolean;
  email_sent_at: string | null;
  raw_json: Record<string, unknown> | null;
  created_at: string;
};

export async function listHomepageMetrics(): Promise<HomepageMetric[]> {
  if (getDataMode() === "supabase") {
    const client = getAnonClient();
    if (client) {
      const { data } = await client
        .from("homepage_metrics")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (data && data.length > 0) return data as HomepageMetric[];
    }
  }

  return [...mockHomepageMetrics].filter((item) => item.is_active).sort((a, b) => a.sort_order - b.sort_order);
}

export async function listServiceAreas(): Promise<ServiceArea[]> {
  if (getDataMode() === "supabase") {
    const client = getAnonClient();
    if (client) {
      const { data } = await client
        .from("service_areas")
        .select("*")
        .order("sort_order", { ascending: true });
      if (data && data.length > 0) return data as ServiceArea[];
    }
  }

  return [...mockServiceAreas].sort((a, b) => a.sort_order - b.sort_order);
}

function parseAddressParts(address: string) {
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  const city = parts[1] ?? null;
  const provinceMatch = address.match(/\b(AB|Alberta)\b/i);
  const postalMatch = address.match(/\b([A-Z]\d[A-Z]\s?\d[A-Z]\d)\b/i);

  return {
    city,
    province: provinceMatch?.[1] ? "AB" : null,
    postal: postalMatch?.[1]?.toUpperCase().replace(/\s+/g, " ") ?? null
  };
}

export async function createInstaquoteAddressQuery(
  input: Omit<InstaquoteAddressQuery, "id" | "queried_at">,
  options?: {
    notesExtras?: Record<string, unknown>;
    requestedScopes?: string[];
    serviceType?: string;
  }
) {
  const payload = {
    id: crypto.randomUUID(),
    queried_at: new Date().toISOString(),
    ...input
  };

  if (getDataMode() === "supabase") {
    const clients = [getServiceClient(), getAnonClient()].filter(Boolean);
    if (clients.length === 0) throw new Error("Supabase client unavailable");

    let instaquoteInsertError: string | null = null;
    for (const client of clients) {
      const { error } = await client!.from("instaquote_address_queries").insert(payload);
      if (!error) {
        instaquoteInsertError = null;
        break;
      }
      instaquoteInsertError = error.message;
    }

    const { city, province, postal } = parseAddressParts(payload.address);
    let quoteEventsErrorMessage: string | null = null;
    for (const client of clients) {
      const { error } = await client!.from("quote_events").upsert({
        id: payload.id,
        created_at: payload.queried_at,
        updated_at: payload.queried_at,
        status: "instaquote_estimated",
        service_type: options?.serviceType ?? input.service_type ?? "InstantQuote:Roof",
        requested_scopes: options?.requestedScopes ?? input.requested_scopes ?? ["roof"],
        address: payload.address,
        city,
        province,
        postal,
        lat: payload.lat,
        lng: payload.lng,
        estimate_low: payload.estimate_low,
        estimate_high: payload.estimate_high,
        notes: JSON.stringify({
          source: payload.data_source,
          neighborhood: payload.neighborhood,
          service_type: options?.serviceType ?? input.service_type ?? "InstantQuote:Roof",
          requested_scopes: options?.requestedScopes ?? input.requested_scopes ?? ["roof"],
          estimate_low: payload.estimate_low,
          estimate_high: payload.estimate_high,
          area_source: payload.area_source,
          solar_status: payload.solar_status,
          solar_debug: payload.solar_debug,
          complexity_band: payload.complexity_band,
          roof_area_sqft: payload.roof_area_sqft,
          pitch_degrees: payload.pitch_degrees,
          place_id: payload.place_id,
          ...(options?.notesExtras ? { extras: options.notesExtras } : {})
        })
      });

      if (!error) {
        quoteEventsErrorMessage = null;
        break;
      }

      quoteEventsErrorMessage = error.message;
    }

    if (instaquoteInsertError && quoteEventsErrorMessage) {
      throw new Error(`instaquote_address_queries: ${instaquoteInsertError}; quote_events: ${quoteEventsErrorMessage}`);
    }

    return payload.id;
  }

  mockQuoteEvents.unshift({
    id: payload.id,
    created_at: payload.queried_at,
    service_slug: null,
    place_id: payload.place_id ?? null,
    address_private: payload.address,
    lat_private: payload.lat,
    lng_private: payload.lng,
    lat_public: payload.lat,
    lng_public: payload.lng,
    estimate_low: payload.estimate_low,
    estimate_high: payload.estimate_high,
    status: "instaquote_estimated"
  });

  return payload.id;
}

export async function createInstaquoteLead(input: Omit<InstaquoteLead, "id" | "created_at" | "email_sent" | "source">) {
  const payload = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    source: "instantquote",
    email_sent: false,
    ...input
  };

  if (getDataMode() === "supabase") {
    const client = getServiceClient() ?? getAnonClient();
    if (!client) throw new Error("Supabase client unavailable");

    let leadInsertError: string | null = null;
    const { error } = await client.from("instaquote_leads").insert(payload);
    if (error) {
      leadInsertError = error.message;
    }

    if (payload.address_query_id) {
      const leadNotes = [
        `budget=${payload.budget_response}`,
        payload.timeline ? `timeline=${payload.timeline}` : null,
        payload.data_source ? `source=${payload.data_source}` : null
      ].filter(Boolean).join(" | ");

      await client
        .from("quote_events")
        .update({
          updated_at: new Date().toISOString(),
          status: "instaquote_lead_submitted",
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          notes: leadNotes || null
        })
        .eq("id", payload.address_query_id);
    }

    if (leadInsertError) {
      // Legacy schema compatibility: still report success to caller routes that degrade gracefully.
      throw new Error(leadInsertError);
    }

    return payload.id;
  }

  return payload.id;
}

export async function createInstaquoteRegionalFeedback(input: {
  address: string | null;
  place_id: string | null;
  lat: number | null;
  lng: number | null;
  base_sqft: number | null;
  shown_sqft: number | null;
  final_sqft: number | null;
  size_choice: string | null;
  complexity_choice: string | null;
  reason: string | null;
}) {
  const payload = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    ...input
  };

  if (getDataMode() === "supabase") {
    const client = getServiceClient() ?? getAnonClient();
    if (!client) throw new Error("Supabase client unavailable");
    const { error } = await client.from("instaquote_regional_feedback").insert(payload);
    if (error) throw new Error(error.message);
    return payload.id;
  }

  return payload.id;
}

export async function listRecentInstaquoteAddressQueries(limit = 500): Promise<InstaquoteAddressQuery[]> {
  if (getDataMode() === "supabase") {
    const readClient = getServiceClient() ?? getAnonClient();
    if (!readClient) return [];

    const { data: legacyData } = await readClient
      .from("quote_events")
      .select("id,address,lat,lng,estimate_low,estimate_high,status,created_at,updated_at,notes")
      .eq("city", "Calgary")
      .or("status.eq.instaquote_estimated,status.eq.instaquote_lead_submitted")
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    return (legacyData ?? []).map((row: Record<string, unknown>) => {
      let parsedNotes: Record<string, unknown> = {};
      if (typeof row.notes === "string") {
        try {
          parsedNotes = JSON.parse(row.notes) as Record<string, unknown>;
        } catch {
          parsedNotes = {};
        }
      }

      const lat = row.lat === null || row.lat === undefined ? null : Number(row.lat);
      const lng = row.lng === null || row.lng === undefined ? null : Number(row.lng);
      const roofAreaSqft = parsedNotes.roof_area_sqft === null || parsedNotes.roof_area_sqft === undefined
        ? null
        : Number(parsedNotes.roof_area_sqft);
      const pitchDegrees = parsedNotes.pitch_degrees === null || parsedNotes.pitch_degrees === undefined
        ? null
        : Number(parsedNotes.pitch_degrees);
      const estimateLow = row.estimate_low === null || row.estimate_low === undefined
        ? (parsedNotes.estimate_low === null || parsedNotes.estimate_low === undefined ? null : Number(parsedNotes.estimate_low))
        : Number(row.estimate_low);
      const estimateHigh = row.estimate_high === null || row.estimate_high === undefined
        ? (parsedNotes.estimate_high === null || parsedNotes.estimate_high === undefined ? null : Number(parsedNotes.estimate_high))
        : Number(row.estimate_high);

      const noteScopes = Array.isArray(parsedNotes.requested_scopes)
        ? parsedNotes.requested_scopes.filter((value): value is string => typeof value === "string")
        : [];
      const extras = typeof parsedNotes.extras === "object" && parsedNotes.extras !== null
        ? parsedNotes.extras as Record<string, unknown>
        : null;
      const extraScopes = Array.isArray(extras?.requestedScopes)
        ? extras.requestedScopes.filter((value): value is string => typeof value === "string")
        : [];

      return {
        id: String(row.id),
        address: String(row.address ?? "Calgary, AB"),
        neighborhood: typeof parsedNotes.neighborhood === "string" ? parsedNotes.neighborhood : null,
        service_type: typeof parsedNotes.service_type === "string"
          ? parsedNotes.service_type
          : "InstantQuote:Roof",
        requested_scopes: noteScopes.length > 0
          ? noteScopes
          : extraScopes.length > 0
            ? extraScopes
            : ["roof"],
        place_id: typeof parsedNotes.place_id === "string" ? parsedNotes.place_id : null,
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
        roof_area_sqft: Number.isFinite(roofAreaSqft) ? roofAreaSqft : null,
        pitch_degrees: Number.isFinite(pitchDegrees) ? pitchDegrees : null,
        complexity_band: typeof parsedNotes.complexity_band === "string" ? parsedNotes.complexity_band : null,
        area_source: typeof parsedNotes.area_source === "string" ? parsedNotes.area_source : null,
        data_source: typeof parsedNotes.source === "string" ? parsedNotes.source : "quote_events_fallback",
        estimate_low: Number.isFinite(estimateLow) ? estimateLow : null,
        estimate_high: Number.isFinite(estimateHigh) ? estimateHigh : null,
        solar_status: typeof parsedNotes.solar_status === "string" ? parsedNotes.solar_status : null,
        solar_debug: typeof parsedNotes.solar_debug === "object" && parsedNotes.solar_debug !== null
          ? parsedNotes.solar_debug as Record<string, unknown>
          : null,
        queried_at: String(row.updated_at ?? row.created_at ?? new Date().toISOString())
      };
    });
  }

  return [];
}
