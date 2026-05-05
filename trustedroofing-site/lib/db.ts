import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { unstable_noStore as noStore } from "next/cache";
import { haversineKm } from "./geo";
import { roundLatLng, sanitizeText } from "./sanitize";
import { getProjectPhotosBucketName } from "./storage";

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
  file_name: string | null;
  stage: "before" | "tear_off_prep" | "installation" | "after" | "detail_issue" | null;
  caption: string | null;
  description: string | null;
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
  quoted_material_cost: number | null;
  quoted_subcontractor_cost: number | null;
  quoted_labor_cost: number | null;
  quoted_equipment_cost: number | null;
  quoted_disposal_cost: number | null;
  quoted_permit_cost: number | null;
  quoted_other_cost: number | null;
  quoted_total_cost: number | null;
  quoted_sale_price: number | null;
  quoted_gross_profit: number | null;
  quoted_gross_margin_percent: number | null;
  actual_material_cost: number | null;
  actual_subcontractor_cost: number | null;
  actual_labor_cost: number | null;
  actual_equipment_cost: number | null;
  actual_disposal_cost: number | null;
  actual_permit_cost: number | null;
  actual_other_cost: number | null;
  actual_total_cost: number | null;
  actual_sale_price: number | null;
  actual_gross_profit: number | null;
  actual_gross_margin_percent: number | null;
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
  content: string | null;
  status: "draft" | "queued" | "published" | "failed";
  published_at: string | null;
  gbp_response: Record<string, unknown> | null;
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
    base_sales_copy: "Roof replacements and roofing system upgrades planned for Calgary hail, ventilation, and weather exposure.",
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
    base_sales_copy: "Standard and premium siding options with moisture-aware detailing around the full exterior envelope.",
    created_at: new Date().toISOString()
  },
  {
    id: "seed-gutters",
    slug: "gutters",
    title: "Eavestrough & Gutters",
    base_sales_copy: "5-inch and 6-inch eavestrough systems planned around real runoff and drainage conditions.",
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
const mockInstantQuotes: InstantQuoteRecord[] = [];
const mockLeads: LeadRecord[] = [];
const mockLeadEmailNotifications: LeadEmailNotification[] = [];
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

function normalizeSlug(value: string) {
  return sanitizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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

async function listStoragePhotosForProject(projectId: string, client: SupabaseClient) {
  const bucket = getProjectPhotosBucketName();
  const storageStages = ["before", "after", "installation", "tear-off-prep", "detail-issue", "tear_off_prep", "detail_issue"] as const;
  const mapped: ProjectPhoto[] = [];
  let sortOrder = 0;

  for (const stageFolder of storageStages) {
    const { data: files } = await client.storage.from(bucket).list(`${projectId}/${stageFolder}`, { limit: 200 });
    for (const file of files ?? []) {
      if (!file.name || file.name.endsWith("/")) continue;
      const path = `${projectId}/${stageFolder}/${file.name}`;
      const { data: publicData } = client.storage.from(bucket).getPublicUrl(path);
      const normalizedStage = stageFolder === "tear-off-prep"
        ? "tear_off_prep"
        : stageFolder === "detail-issue"
          ? "detail_issue"
          : stageFolder;
      mapped.push({
        id: `storage-${projectId}-${path}`,
        project_id: projectId,
        storage_provider: "supabase",
        storage_bucket: bucket,
        storage_path: path,
        public_url: publicData.publicUrl,
        file_size: null,
        mime_type: null,
        width: null,
        height: null,
        file_name: file.name,
        stage: normalizedStage as ProjectPhoto["stage"],
        caption: null,
        description: null,
        sort_order: sortOrder,
        is_primary: sortOrder === 0,
        address_private: null,
        lat_private: null,
        lng_private: null,
        lat_public: null,
        lng_public: null,
        geocode_source: null,
        blurhash: null,
        created_at: new Date().toISOString()
      });
      sortOrder += 1;
    }
  }

  return mapped;
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
  noStore();
  const includeUnpublished = !!filters?.include_unpublished;

  if (getDataMode() === "supabase") {
    const client = includeUnpublished
      ? (getServiceClient() ?? getAnonClient())
      : getAnonClient();
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

      const missingPhotos = output.filter((project) => (project.photos?.length ?? 0) === 0);
      if (missingPhotos.length > 0) {
        const recoveredSets = await Promise.all(
          missingPhotos.map(async (project) => ({ id: project.id, set: await getProjectImageSet(project.id) }))
        );
        const recoveredMap = new Map(recoveredSets.map((entry) => [entry.id, entry.set]));
        output = output.map((project) => ({
          ...project,
          photos: (project.photos?.length ?? 0) > 0 ? project.photos : (recoveredMap.get(project.id)?.gallery ?? [])
        }));
      }

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
  const imageSet = imageSets.get(projectId) ?? { primaryImage: null, gallery: [] };

  if (getDataMode() === "supabase" && imageSet.gallery.length === 0) {
    const client = getServiceClient();
    if (client) {
      const storagePhotos = await listStoragePhotosForProject(projectId, client);
      if (storagePhotos.length > 0) {
        return buildProjectImageSet(storagePhotos);
      }
    }
  }

  return imageSet;
}

export async function getProjectBySlug(slug: string, includeUnpublished = false): Promise<Project | null> {
  if (getDataMode() === "supabase") {
    const client = includeUnpublished
      ? (getServiceClient() ?? getAnonClient())
      : getAnonClient();
    if (client) {
      const { data } = await client.from("projects").select("*").eq("slug", slug).maybeSingle();
      if (!data) return null;
      if (!includeUnpublished && !(data as Project).is_published) return null;
      const imageSet = await getProjectImageSet((data as Project).id);
      return { ...(data as Project), photos: imageSet.gallery };
    }
  }

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

export async function listGeoPosts(
  limit?: number | null,
  filters?: { serviceSlugs?: string[] }
): Promise<ResolvedGeoPost[]> {
  noStore();
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
      let query = client
        .from("geo_posts")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      const serviceSlugs = filters?.serviceSlugs?.filter((slug) => typeof slug === "string" && slug.length > 0) ?? [];
      if (serviceSlugs.length > 0) query = query.in("service_slug", serviceSlugs);
      if (limit) query = query.limit(limit);

      const { data } = await query;

      const geoPosts = ((data ?? []) as GeoPost[]).filter((geoPost) => !!geoPost.slug);
      return resolveGeoPosts(geoPosts);
    }
  }

  const serviceSlugs = filters?.serviceSlugs?.filter((slug) => typeof slug === "string" && slug.length > 0) ?? [];
  const filtered = mockGeoPosts.filter((geoPost) => {
    if (!geoPost.slug) return false;
    if (geoPost.status !== "published") return false;
    if (serviceSlugs.length > 0 && (!geoPost.service_slug || !serviceSlugs.includes(geoPost.service_slug))) return false;
    return true;
  });
  return resolveGeoPosts(filtered.slice(0, limit ?? undefined));
}

export async function getGeoPostBySlug(slug: string): Promise<ResolvedGeoPost | null> {
  const geoPosts = await listGeoPosts();
  return geoPosts.find((geoPost) => geoPost.slug === slug) ?? null;
}

export async function listAdminGeoPosts(limit = 200): Promise<GeoPost[]> {
  if (getDataMode() === "supabase") {
    const client = getServiceClient() ?? getAnonClient();
    if (!client) return [] as GeoPost[];
    const { data } = await client
      .from("geo_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as GeoPost[];
  }
  return [...mockGeoPosts].slice(0, limit);
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
  quoted_material_cost?: number | null;
  quoted_subcontractor_cost?: number | null;
  quoted_labor_cost?: number | null;
  quoted_equipment_cost?: number | null;
  quoted_disposal_cost?: number | null;
  quoted_permit_cost?: number | null;
  quoted_other_cost?: number | null;
  quoted_sale_price?: number | null;
  actual_material_cost?: number | null;
  actual_subcontractor_cost?: number | null;
  actual_labor_cost?: number | null;
  actual_equipment_cost?: number | null;
  actual_disposal_cost?: number | null;
  actual_permit_cost?: number | null;
  actual_other_cost?: number | null;
  actual_sale_price?: number | null;
};

function toProjectPayload(data: ProjectInput) {
  const rounded = roundLatLng(data.lat_private ?? null, data.lng_private ?? null, 3);
  const quotedTotalCost =
    (data.quoted_material_cost ?? 0) +
    (data.quoted_subcontractor_cost ?? 0) +
    (data.quoted_labor_cost ?? 0) +
    (data.quoted_equipment_cost ?? 0) +
    (data.quoted_disposal_cost ?? 0) +
    (data.quoted_permit_cost ?? 0) +
    (data.quoted_other_cost ?? 0);
  const actualTotalCost =
    (data.actual_material_cost ?? 0) +
    (data.actual_subcontractor_cost ?? 0) +
    (data.actual_labor_cost ?? 0) +
    (data.actual_equipment_cost ?? 0) +
    (data.actual_disposal_cost ?? 0) +
    (data.actual_permit_cost ?? 0) +
    (data.actual_other_cost ?? 0);
  const quotedGrossProfit = data.quoted_sale_price !== null && data.quoted_sale_price !== undefined
    ? data.quoted_sale_price - quotedTotalCost
    : null;
  const actualGrossProfit = data.actual_sale_price !== null && data.actual_sale_price !== undefined
    ? data.actual_sale_price - actualTotalCost
    : null;
  const quotedGrossMarginPercent =
    quotedGrossProfit !== null && data.quoted_sale_price && data.quoted_sale_price !== 0
      ? (quotedGrossProfit / data.quoted_sale_price) * 100
      : null;
  const actualGrossMarginPercent =
    actualGrossProfit !== null && data.actual_sale_price && data.actual_sale_price !== 0
      ? (actualGrossProfit / data.actual_sale_price) * 100
      : null;

  return {
    slug: normalizeSlug(data.slug),
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
    is_published: data.is_published ?? true,
    quoted_material_cost: data.quoted_material_cost ?? null,
    quoted_subcontractor_cost: data.quoted_subcontractor_cost ?? null,
    quoted_labor_cost: data.quoted_labor_cost ?? null,
    quoted_equipment_cost: data.quoted_equipment_cost ?? null,
    quoted_disposal_cost: data.quoted_disposal_cost ?? null,
    quoted_permit_cost: data.quoted_permit_cost ?? null,
    quoted_other_cost: data.quoted_other_cost ?? null,
    quoted_total_cost: quotedTotalCost,
    quoted_sale_price: data.quoted_sale_price ?? null,
    quoted_gross_profit: quotedGrossProfit,
    quoted_gross_margin_percent: quotedGrossMarginPercent,
    actual_material_cost: data.actual_material_cost ?? null,
    actual_subcontractor_cost: data.actual_subcontractor_cost ?? null,
    actual_labor_cost: data.actual_labor_cost ?? null,
    actual_equipment_cost: data.actual_equipment_cost ?? null,
    actual_disposal_cost: data.actual_disposal_cost ?? null,
    actual_permit_cost: data.actual_permit_cost ?? null,
    actual_other_cost: data.actual_other_cost ?? null,
    actual_total_cost: actualTotalCost,
    actual_sale_price: data.actual_sale_price ?? null,
    actual_gross_profit: actualGrossProfit,
    actual_gross_margin_percent: actualGrossMarginPercent
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
  const existingProject = await getProjectById(id);
  if (!existingProject) throw new Error("Project not found");

  const partialPayload = toProjectPayload({
    slug: data.slug ?? existingProject.slug,
    title: data.title ?? existingProject.title,
    summary: data.summary ?? existingProject.summary,
    description: data.description ?? existingProject.description,
    service_slug: data.service_slug ?? existingProject.service_slug,
    city: data.city ?? existingProject.city,
    province: data.province ?? existingProject.province,
    neighborhood: data.neighborhood ?? existingProject.neighborhood,
    quadrant: data.quadrant ?? existingProject.quadrant,
    address_private: data.address_private ?? existingProject.address_private,
    place_id: data.place_id ?? existingProject.place_id,
    geocode_source: data.geocode_source ?? existingProject.geocode_source,
    lat_private: data.lat_private ?? existingProject.lat_private,
    lng_private: data.lng_private ?? existingProject.lng_private,
    completed_at: data.completed_at ?? existingProject.completed_at,
    is_published: data.is_published ?? existingProject.is_published,
    quoted_material_cost: data.quoted_material_cost ?? existingProject.quoted_material_cost,
    quoted_subcontractor_cost: data.quoted_subcontractor_cost ?? existingProject.quoted_subcontractor_cost,
    quoted_labor_cost: data.quoted_labor_cost ?? existingProject.quoted_labor_cost,
    quoted_equipment_cost: data.quoted_equipment_cost ?? existingProject.quoted_equipment_cost,
    quoted_disposal_cost: data.quoted_disposal_cost ?? existingProject.quoted_disposal_cost,
    quoted_permit_cost: data.quoted_permit_cost ?? existingProject.quoted_permit_cost,
    quoted_other_cost: data.quoted_other_cost ?? existingProject.quoted_other_cost,
    quoted_sale_price: data.quoted_sale_price ?? existingProject.quoted_sale_price,
    actual_material_cost: data.actual_material_cost ?? existingProject.actual_material_cost,
    actual_subcontractor_cost: data.actual_subcontractor_cost ?? existingProject.actual_subcontractor_cost,
    actual_labor_cost: data.actual_labor_cost ?? existingProject.actual_labor_cost,
    actual_equipment_cost: data.actual_equipment_cost ?? existingProject.actual_equipment_cost,
    actual_disposal_cost: data.actual_disposal_cost ?? existingProject.actual_disposal_cost,
    actual_permit_cost: data.actual_permit_cost ?? existingProject.actual_permit_cost,
    actual_other_cost: data.actual_other_cost ?? existingProject.actual_other_cost,
    actual_sale_price: data.actual_sale_price ?? existingProject.actual_sale_price
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
    file_name?: string | null;
    stage?: "before" | "tear_off_prep" | "installation" | "after" | "detail_issue" | null;
    caption?: string | null;
    description?: string | null;
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
    file_name: photo.file_name ?? null,
    stage: photo.stage ?? "before",
    caption: photo.caption ?? null,
    description: photo.description ?? null,
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
    let { data, error } = await client
      .from("project_photos")
      .insert(payload)
      .select("*")
      .single();

    if (error?.message.includes("Could not find the")) {
      const fallbackPayload = {
        ...payload,
        file_name: undefined,
        stage: undefined,
        description: undefined
      };
      ({ data, error } = await client
        .from("project_photos")
        .insert(fallbackPayload)
        .select("*")
        .single());
    }

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

export async function updateProjectPhoto(
  photoId: string,
  updates: {
    file_name?: string | null;
    stage?: "before" | "tear_off_prep" | "installation" | "after" | "detail_issue" | null;
    caption?: string | null;
    description?: string | null;
  }
) {
  const payload = {
    ...(updates.file_name !== undefined ? { file_name: updates.file_name?.trim() || null } : {}),
    ...(updates.stage !== undefined ? { stage: updates.stage } : {}),
    ...(updates.caption !== undefined ? { caption: updates.caption?.trim() || null } : {}),
    ...(updates.description !== undefined ? { description: updates.description?.trim() || null } : {})
  };

  if (getDataMode() === "supabase") {
    const client = getServiceClient();
    if (!client) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin writes.");
    let { data, error } = await client
      .from("project_photos")
      .update(payload)
      .eq("id", photoId)
      .select("*")
      .single();

    if (error?.message.includes("Could not find the")) {
      const fallbackPayload = {
        ...(payload.caption !== undefined ? { caption: payload.caption } : {})
      };
      ({ data, error } = await client
        .from("project_photos")
        .update(fallbackPayload)
        .eq("id", photoId)
        .select("*")
        .single());
    }

    if (error) throw new Error(error.message);
    return data as ProjectPhoto;
  }

  const existing = mockProjectPhotos.find((photo) => photo.id === photoId);
  if (!existing) throw new Error("Photo not found");
  Object.assign(existing, payload);
  return existing;
}

export async function deleteProjectPhoto(photoId: string) {
  if (getDataMode() === "supabase") {
    const client = getServiceClient();
    if (!client) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin writes.");
    const { error } = await client
      .from("project_photos")
      .delete()
      .eq("id", photoId);
    if (error) throw new Error(error.message);
    return true;
  }

  const index = mockProjectPhotos.findIndex((photo) => photo.id === photoId);
  if (index >= 0) {
    mockProjectPhotos.splice(index, 1);
  }
  return true;
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
    primary_image_url: primaryImage,
    content: project.summary?.trim() || project.description?.trim() || "",
    status: "draft" as const,
    published_at: null,
    gbp_response: null
  };

  const uniqueConstraintHint = "Run migration 0008_geo_posts_project_unique.sql.";

  if (getDataMode() === "supabase") {
    const client = getServiceClient();
    if (!client) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for geo_post writes.");
    const { data: existingRows } = await client
      .from("geo_posts")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: true })
      .limit(1);
    const existing = ((existingRows ?? [])[0] as GeoPost | undefined) ?? null;
    const mergedPayload = {
      ...payload,
      content: existing?.content ?? payload.content,
      primary_image_url: existing?.primary_image_url ?? payload.primary_image_url,
      service_slug: existing?.service_slug ?? payload.service_slug
    };

    const { data, error } = await client
      .from("geo_posts")
      .upsert(mergedPayload, { onConflict: "project_id" })
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
          .update(mergedPayload)
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
        .insert(mergedPayload)
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
  const existing = existingIndex >= 0 ? mockGeoPosts[existingIndex] : null;
  const base: GeoPost = {
    id: existingIndex >= 0 ? mockGeoPosts[existingIndex].id : crypto.randomUUID(),
    created_at: existingIndex >= 0 ? mockGeoPosts[existingIndex].created_at : new Date().toISOString(),
    ...payload,
    content: existing?.content ?? payload.content,
    primary_image_url: existing?.primary_image_url ?? payload.primary_image_url,
    service_slug: existing?.service_slug ?? payload.service_slug
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

    if (error) {
      if (error.message.includes("Could not find the table 'public.gbp_post_queue'")) return;
      throw new Error(error.message);
    }
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

export type HistoricalRoofProfile = {
  queryId: string;
  roofAreaSqft: number;
  pitchDegrees: number;
  complexityBand: "simple" | "moderate" | "complex";
  areaSource: "solar" | "regional";
  matchedBy: "place_id" | "coordinates" | "address";
  queriedAt: string;
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

export type InstantQuoteRecord = {
  id: string;
  legacy_address_query_id: string | null;
  address: string;
  service_type: string | null;
  quote_low: number | null;
  quote_high: number | null;
  has_contact_submission: boolean;
  project_id: string | null;
  is_marketing: boolean;
  created_at: string;
};

export type LeadRecord = {
  id: string;
  instant_quote_id: string;
  name: string | null;
  email: string;
  phone: string | null;
  budget_response: string | null;
  timeline: string | null;
  service_type: string | null;
  quote_low: number | null;
  quote_high: number | null;
  submitted_at: string | null;
  created_at: string;
};

export type LeadEmailNotification = {
  id: string;
  lead_id: string;
  recipient_type: "internal" | "customer";
  recipient_email: string;
  status: "sent" | "failed";
  provider_message_id: string | null;
  error_message: string | null;
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

export async function countLiveQuoteSignals(): Promise<number> {
  if (getDataMode() === "supabase") {
    const client = getServiceClient() ?? getAnonClient();
    if (client) {
      const { count } = await client
        .from("quote_events")
        .select("id", { count: "exact", head: true })
        .or("status.eq.instaquote_estimated,status.eq.instaquote_lead_submitted");
      return count ?? 0;
    }
  }

  return mockQuoteEvents.length;
}

export async function countPublishedProjects(): Promise<number> {
  if (getDataMode() === "supabase") {
    const client = getAnonClient();
    if (client) {
      const { count } = await client
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true);
      return count ?? 0;
    }
  }

  return mockProjects.filter((project) => project.is_published).length;
}

export async function countLiveGeoPosts(): Promise<number> {
  if (getDataMode() === "supabase") {
    const client = getAnonClient();
    if (client) {
      const { count } = await client
        .from("geo_posts")
        .select("id", { count: "exact", head: true })
        .not("slug", "is", null);
      return count ?? 0;
    }
  }

  return mockGeoPosts.filter((geoPost) => !!geoPost.slug).length;
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

export async function refreshInstaquoteAddressQuery(
  id: string,
  input: Omit<InstaquoteAddressQuery, "id" | "queried_at">,
  options?: {
    notesExtras?: Record<string, unknown>;
    requestedScopes?: string[];
    serviceType?: string;
  }
) {
  const queriedAt = new Date().toISOString();

  if (getDataMode() === "supabase") {
    const client = getServiceClient() ?? getAnonClient();
    if (!client) throw new Error("Supabase client unavailable");

    const { error: queryError } = await client
      .from("instaquote_address_queries")
      .update({
        ...input,
        queried_at: queriedAt
      })
      .eq("id", id);
    if (queryError) throw new Error(queryError.message);

    const { city, province, postal } = parseAddressParts(input.address);
    const { error: eventError } = await client
      .from("quote_events")
      .update({
        updated_at: queriedAt,
        status: "instaquote_estimated",
        service_type: options?.serviceType ?? input.service_type ?? "InstantQuote:Roof",
        requested_scopes: options?.requestedScopes ?? input.requested_scopes ?? ["roof"],
        address: input.address,
        city,
        province,
        postal,
        lat: input.lat,
        lng: input.lng,
        estimate_low: input.estimate_low,
        estimate_high: input.estimate_high,
        notes: JSON.stringify({
          source: input.data_source,
          neighborhood: input.neighborhood,
          service_type: options?.serviceType ?? input.service_type ?? "InstantQuote:Roof",
          requested_scopes: options?.requestedScopes ?? input.requested_scopes ?? ["roof"],
          estimate_low: input.estimate_low,
          estimate_high: input.estimate_high,
          area_source: input.area_source,
          solar_status: input.solar_status,
          solar_debug: input.solar_debug,
          complexity_band: input.complexity_band,
          roof_area_sqft: input.roof_area_sqft,
          pitch_degrees: input.pitch_degrees,
          place_id: input.place_id,
          ...(options?.notesExtras ? { extras: options.notesExtras } : {})
        })
      })
      .eq("id", id);
    if (eventError) throw new Error(eventError.message);

    return id;
  }

  return id;
}

export async function upsertInstantQuoteFromAddressQuery(input: {
  legacy_address_query_id: string;
  address: string;
  service_type: string | null;
  quote_low: number | null;
  quote_high: number | null;
  created_at?: string;
}) {
  const payload: InstantQuoteRecord = {
    id: crypto.randomUUID(),
    legacy_address_query_id: input.legacy_address_query_id,
    address: input.address || "Unknown address",
    service_type: input.service_type,
    quote_low: input.quote_low,
    quote_high: input.quote_high,
    has_contact_submission: false,
    project_id: null,
    is_marketing: false,
    created_at: input.created_at ?? new Date().toISOString()
  };

  if (getDataMode() === "supabase") {
    const client = getServiceClient() ?? getAnonClient();
    if (!client) throw new Error("Supabase client unavailable");

    const { data: existing } = await client
      .from("instant_quotes")
      .select("*")
      .eq("legacy_address_query_id", input.legacy_address_query_id)
      .maybeSingle();
    if (existing) return existing as InstantQuoteRecord;

    const { data, error } = await client.from("instant_quotes").insert(payload).select("*").single();
    if (error) throw new Error(error.message);
    return data as InstantQuoteRecord;
  }

  const existing = mockInstantQuotes.find((row) => row.legacy_address_query_id === input.legacy_address_query_id);
  if (existing) return existing;
  mockInstantQuotes.unshift(payload);
  return payload;
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

    let linkedInstantQuote: InstantQuoteRecord | null = null;
    if (payload.address_query_id) {
      linkedInstantQuote = await upsertInstantQuoteFromAddressQuery({
        legacy_address_query_id: payload.address_query_id,
        address: payload.address,
        service_type: payload.data_source ?? null,
        quote_low: payload.good_low,
        quote_high: payload.good_high,
        created_at: payload.created_at
      });

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

    if (linkedInstantQuote) {
      await client.from("instant_quotes").update({ has_contact_submission: true }).eq("id", linkedInstantQuote.id);
      const lifecycleLead: LeadRecord = {
        id: crypto.randomUUID(),
        instant_quote_id: linkedInstantQuote.id,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        budget_response: payload.budget_response,
        timeline: payload.timeline,
        service_type: payload.data_source ?? null,
        quote_low: payload.good_low,
        quote_high: payload.good_high,
        submitted_at: payload.created_at,
        created_at: payload.created_at
      };
      const { error: lifecycleLeadError } = await client.from("leads").insert(lifecycleLead);
      if (lifecycleLeadError) {
        console.error("lead lifecycle insert failed", lifecycleLeadError.message);
      }
    }

    if (leadInsertError) {
      // Legacy schema compatibility: still report success to caller routes that degrade gracefully.
      throw new Error(leadInsertError);
    }

    return payload.id;
  }

  const linkedInstantQuote = payload.address_query_id
    ? await upsertInstantQuoteFromAddressQuery({
      legacy_address_query_id: payload.address_query_id,
      address: payload.address,
      service_type: payload.data_source ?? null,
      quote_low: payload.good_low,
      quote_high: payload.good_high,
      created_at: payload.created_at
    })
    : null;
  if (linkedInstantQuote) {
    linkedInstantQuote.has_contact_submission = true;
    mockLeads.unshift({
      id: crypto.randomUUID(),
      instant_quote_id: linkedInstantQuote.id,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      budget_response: payload.budget_response,
      timeline: payload.timeline,
      service_type: payload.data_source ?? null,
      quote_low: payload.good_low,
      quote_high: payload.good_high,
      submitted_at: payload.created_at,
      created_at: payload.created_at
    });
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
      .select("id,address,city,province,lat,lng,estimate_low,estimate_high,status,created_at,updated_at,notes")
      .or("status.eq.instaquote_estimated,status.eq.instaquote_lead_submitted")
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    const isAlbertaRecord = (row: Record<string, unknown>) => {
      const province = typeof row.province === "string" ? row.province.trim().toLowerCase() : "";
      if (province === "ab" || province === "alberta") return true;
      const address = typeof row.address === "string" ? row.address : "";
      return /\b(AB|Alberta)\b/i.test(address);
    };

    return (legacyData ?? [])
      .filter((row: Record<string, unknown>) => isAlbertaRecord(row))
      .map((row: Record<string, unknown>) => {
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

function normalizeAddressMatch(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/, canada\b/g, "")
    .trim();
}

export async function findHistoricalRoofProfile(input: {
  placeId?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
}): Promise<HistoricalRoofProfile | null> {
  if (getDataMode() !== "supabase") return null;

  const client = getServiceClient() ?? getAnonClient();
  if (!client) return null;

  const { data } = await client
    .from("instaquote_address_queries")
    .select("id,place_id,address,lat,lng,roof_area_sqft,pitch_degrees,complexity_band,area_source,queried_at")
    .in("area_source", ["solar", "regional"])
    .not("roof_area_sqft", "is", null)
    .order("queried_at", { ascending: false })
    .limit(200);

  const currentYear = new Date().getUTCFullYear();
  const rows = ((data ?? []) as Array<{
    id: string;
    place_id: string | null;
    address: string;
    lat: number | null;
    lng: number | null;
    roof_area_sqft: number | null;
    pitch_degrees: number | null;
    complexity_band: string | null;
    area_source: string | null;
    queried_at: string;
  }>).filter((row) => new Date(row.queried_at).getUTCFullYear() === currentYear);

  const targetPlaceId = (input.placeId ?? "").trim();
  const targetAddress = normalizeAddressMatch(input.address);
  const targetLat = typeof input.lat === "number" && Number.isFinite(input.lat) ? input.lat : null;
  const targetLng = typeof input.lng === "number" && Number.isFinite(input.lng) ? input.lng : null;

  const byPlace = targetPlaceId
    ? rows.find((row) => row.place_id === targetPlaceId)
    : undefined;
  const byCoordinates = targetLat !== null && targetLng !== null
    ? rows.find((row) => {
      if (typeof row.lat !== "number" || typeof row.lng !== "number") return false;
      return Math.abs(row.lat - targetLat) <= 0.0003 && Math.abs(row.lng - targetLng) <= 0.0003;
    })
    : undefined;
  const byAddress = targetAddress
    ? rows.find((row) => normalizeAddressMatch(row.address) === targetAddress)
    : undefined;

  const matched = byPlace ?? byCoordinates ?? byAddress;
  if (!matched || typeof matched.roof_area_sqft !== "number" || !Number.isFinite(matched.roof_area_sqft)) {
    return null;
  }

  const pitch = typeof matched.pitch_degrees === "number" && Number.isFinite(matched.pitch_degrees)
    ? matched.pitch_degrees
    : 25;
  const complexity = matched.complexity_band === "simple" || matched.complexity_band === "complex"
    ? matched.complexity_band
    : "moderate";
  const areaSource = matched.area_source === "solar" ? "solar" : "regional";
  const matchedBy: HistoricalRoofProfile["matchedBy"] = byPlace
    ? "place_id"
    : byCoordinates
      ? "coordinates"
      : "address";

  return {
    queryId: matched.id,
    roofAreaSqft: Math.round(matched.roof_area_sqft),
    pitchDegrees: pitch,
    complexityBand: complexity,
    areaSource,
    matchedBy,
    queriedAt: matched.queried_at
  };
}

export async function listAdminInstantQuotes(filters?: {
  status?: "all" | "quote_only" | "lead_submitted" | "linked_project";
  is_marketing?: "all" | "marketing" | "internal";
  from?: string | null;
  to?: string | null;
  q?: string | null;
  limit?: number;
}) {
  const limit = filters?.limit ?? 300;
  if (getDataMode() === "supabase") {
    const client = getServiceClient() ?? getAnonClient();
    if (!client) return [] as InstantQuoteRecord[];
    let query = client.from("instant_quotes").select("*").order("created_at", { ascending: false }).limit(limit);
    if (filters?.q) query = query.ilike("address", `%${filters.q}%`);
    if (filters?.from) query = query.gte("created_at", filters.from);
    if (filters?.to) query = query.lte("created_at", filters.to);
    if (filters?.is_marketing === "marketing") query = query.eq("is_marketing", true);
    if (filters?.is_marketing === "internal") query = query.eq("is_marketing", false);
    if (filters?.status === "quote_only") query = query.eq("has_contact_submission", false).is("project_id", null);
    if (filters?.status === "lead_submitted") query = query.eq("has_contact_submission", true).is("project_id", null);
    if (filters?.status === "linked_project") query = query.not("project_id", "is", null);
    const { data } = await query;
    return (data ?? []) as InstantQuoteRecord[];
  }

  return mockInstantQuotes
    .filter((row) => !filters?.q || row.address.toLowerCase().includes(filters.q.toLowerCase()))
    .filter((row) => filters?.is_marketing === "all" || !filters?.is_marketing
      ? true
      : filters.is_marketing === "marketing"
        ? row.is_marketing
        : !row.is_marketing)
    .filter((row) => {
      if (filters?.status === "quote_only") return !row.has_contact_submission && !row.project_id;
      if (filters?.status === "lead_submitted") return row.has_contact_submission && !row.project_id;
      if (filters?.status === "linked_project") return !!row.project_id;
      return true;
    })
    .slice(0, limit);
}

export async function setInstantQuoteMarketingTag(id: string, is_marketing: boolean) {
  if (getDataMode() === "supabase") {
    const client = getServiceClient();
    if (!client) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin writes.");
    const { data, error } = await client.from("instant_quotes").update({ is_marketing }).eq("id", id).select("*").single();
    if (error) throw new Error(error.message);
    return data as InstantQuoteRecord;
  }
  const row = mockInstantQuotes.find((item) => item.id === id);
  if (!row) throw new Error("Instant quote not found");
  row.is_marketing = is_marketing;
  return row;
}

export async function linkInstantQuotesToProject(projectId: string, quoteIds: string[]) {
  if (quoteIds.length === 0) return;
  if (getDataMode() === "supabase") {
    const client = getServiceClient();
    if (!client) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin writes.");
    const { error } = await client.from("instant_quotes").update({ project_id: projectId }).in("id", quoteIds);
    if (error) throw new Error(error.message);
    return;
  }
  mockInstantQuotes.forEach((row) => {
    if (quoteIds.includes(row.id)) row.project_id = projectId;
  });
}

export async function listProjectInstantQuotes(projectId: string) {
  return listAdminInstantQuotes({ status: "all", limit: 500 }).then((rows) => rows.filter((row) => row.project_id === projectId));
}

export async function listLeadsByInstantQuoteIds(quoteIds: string[]) {
  if (quoteIds.length === 0) return [] as LeadRecord[];
  if (getDataMode() === "supabase") {
    const client = getServiceClient() ?? getAnonClient();
    if (!client) return [] as LeadRecord[];
    const { data } = await client.from("leads").select("*").in("instant_quote_id", quoteIds).order("created_at", { ascending: false });
    return (data ?? []) as LeadRecord[];
  }
  return mockLeads.filter((lead) => quoteIds.includes(lead.instant_quote_id));
}

export async function upsertLifecycleLeadFromSubmission(input: {
  legacy_address_query_id: string;
  name: string | null;
  email: string;
  phone: string | null;
  budget_response: string | null;
  timeline: string | null;
  service_type: string | null;
  quote_low: number | null;
  quote_high: number | null;
}) {
  const instantQuote = await upsertInstantQuoteFromAddressQuery({
    legacy_address_query_id: input.legacy_address_query_id,
    address: "",
    service_type: input.service_type,
    quote_low: input.quote_low,
    quote_high: input.quote_high
  });

  if (getDataMode() === "supabase") {
    const client = getServiceClient();
    if (!client) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin writes.");
    await client.from("instant_quotes").update({ has_contact_submission: true }).eq("id", instantQuote.id);

    const { data: existing } = await client
      .from("leads")
      .select("*")
      .eq("instant_quote_id", instantQuote.id)
      .eq("email", input.email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) return existing as LeadRecord;

    const payload: LeadRecord = {
      id: crypto.randomUUID(),
      instant_quote_id: instantQuote.id,
      name: input.name,
      email: input.email,
      phone: input.phone,
      budget_response: input.budget_response,
      timeline: input.timeline,
      service_type: input.service_type,
      quote_low: input.quote_low,
      quote_high: input.quote_high,
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    const { data, error } = await client.from("leads").insert(payload).select("*").single();
    if (error) throw new Error(error.message);
    return data as LeadRecord;
  }

  instantQuote.has_contact_submission = true;
  const existing = mockLeads.find((lead) => lead.instant_quote_id === instantQuote.id && lead.email === input.email);
  if (existing) return existing;
  const created: LeadRecord = {
    id: crypto.randomUUID(),
    instant_quote_id: instantQuote.id,
    name: input.name,
    email: input.email,
    phone: input.phone,
    budget_response: input.budget_response,
    timeline: input.timeline,
    service_type: input.service_type,
    quote_low: input.quote_low,
    quote_high: input.quote_high,
    submitted_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  };
  mockLeads.unshift(created);
  return created;
}

export async function upsertLeadEmailNotification(input: Omit<LeadEmailNotification, "id" | "created_at">) {
  const payload = { ...input, id: crypto.randomUUID(), created_at: new Date().toISOString() };
  if (getDataMode() === "supabase") {
    const client = getServiceClient();
    if (!client) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin writes.");
    const { error } = await client.from("lead_email_notifications").upsert(payload, { onConflict: "lead_id,recipient_type" });
    if (error) throw new Error(error.message);
    return payload;
  }
  const idx = mockLeadEmailNotifications.findIndex(
    (row) => row.lead_id === input.lead_id && row.recipient_type === input.recipient_type
  );
  if (idx >= 0) mockLeadEmailNotifications[idx] = payload;
  else mockLeadEmailNotifications.push(payload);
  return payload;
}

export async function listLeadEmailNotifications(leadId: string) {
  if (getDataMode() === "supabase") {
    const client = getServiceClient() ?? getAnonClient();
    if (!client) return [] as LeadEmailNotification[];
    const { data } = await client.from("lead_email_notifications").select("*").eq("lead_id", leadId);
    return (data ?? []) as LeadEmailNotification[];
  }
  return mockLeadEmailNotifications.filter((row) => row.lead_id === leadId);
}

export async function publishGeoPostById(id: string) {
  if (getDataMode() === "supabase") {
    const client = getServiceClient();
    if (!client) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin writes.");
    const { data: geoPost, error } = await client.from("geo_posts").select("*").eq("id", id).single();
    if (error) throw new Error(error.message);
    // GBP queueing is intentionally disabled until the gbp_post_queue table
    // and worker pipeline are fully implemented.
    const publishedAt = new Date().toISOString();
    const { data: updated, error: updateError } = await client
      .from("geo_posts")
      .update({
        status: "published",
        published_at: publishedAt,
        gbp_response: { ok: true, published_at: publishedAt, queued: false, note: "GBP queueing disabled" }
      })
      .eq("id", id)
      .select("*")
      .single();
    if (updateError) throw new Error(updateError.message);
    return updated as GeoPost;
  }

  const row = mockGeoPosts.find((geoPost) => geoPost.id === id);
  if (!row) throw new Error("Geo post not found");
  row.status = "published";
  row.published_at = new Date().toISOString();
  row.gbp_response = { ok: true, queued: false, note: "GBP queueing disabled" };
  return row;
}

export async function updateGeoPostAdmin(
  id: string,
  input: {
    content?: string | null;
    primary_image_url?: string | null;
    service_slug?: string | null;
    status?: "draft" | "queued" | "published" | "failed";
  }
) {
  if (getDataMode() === "supabase") {
    const client = getServiceClient();
    if (!client) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin writes.");
    const payload: Record<string, unknown> = {};
    if (input.content !== undefined) payload.content = input.content;
    if (input.primary_image_url !== undefined) payload.primary_image_url = input.primary_image_url;
    if (input.service_slug !== undefined) payload.service_slug = input.service_slug;
    if (input.status !== undefined) payload.status = input.status;
    const { data, error } = await client.from("geo_posts").update(payload).eq("id", id).select("*").single();
    if (error) throw new Error(error.message);
    return data as GeoPost;
  }

  const row = mockGeoPosts.find((geoPost) => geoPost.id === id);
  if (!row) throw new Error("Geo post not found");
  if (input.content !== undefined) row.content = input.content;
  if (input.primary_image_url !== undefined) row.primary_image_url = input.primary_image_url;
  if (input.service_slug !== undefined) row.service_slug = input.service_slug;
  if (input.status !== undefined) row.status = input.status;
  return row;
}
