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
  storage_path: string;
  public_url: string;
  caption: string | null;
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
  lat_private: number | null;
  lng_private: number | null;
  lat_public: number | null;
  lng_public: number | null;
  completed_at: string | null;
  created_at: string;
  is_published: boolean;
  photos?: ProjectPhoto[];
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
const mockQuoteEvents: Array<{ id: string; created_at: string } & QuoteEventStep1> = [];
const mockQuoteContacts: Array<{
  quote_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  preferred_contact: string | null;
  created_at: string;
}> = [];
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

async function fetchPhotosByProjectIds(projectIds: string[]) {
  const client = getAnonClient();
  if (!client || projectIds.length === 0) return [] as ProjectPhoto[];

  const { data } = await client
    .from("project_photos")
    .select("*")
    .in("project_id", projectIds)
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
      const photos = await fetchPhotosByProjectIds(projects.map((project) => project.id));

      let output = projects.map((project) => ({
        ...project,
        photos: photos.filter((photo) => photo.project_id === project.id)
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

  output = output.map((project) => ({
    ...project,
    photos: mockProjectPhotos.filter((photo) => photo.project_id === project.id).sort((a, b) => a.sort_order - b.sort_order)
  }));

  if (filters?.limit) output = output.slice(0, filters.limit);
  return output;
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
      const photos = await fetchPhotosByProjectIds([id]);
      return { ...(data as Project), photos };
    }
  }

  const project = mockProjects.find((item) => item.id === id);
  if (!project) return null;
  return {
    ...project,
    photos: mockProjectPhotos.filter((photo) => photo.project_id === id).sort((a, b) => a.sort_order - b.sort_order)
  };
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
    lat_private: data.lat_private,
    lng_private: data.lng_private,
    completed_at: data.completed_at,
    is_published: data.is_published
  });

  const payload = Object.fromEntries(
    Object.entries(partialPayload).filter(([_, value]) => value !== "")
  );

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
    storage_path: string;
    public_url: string;
    caption?: string | null;
    sort_order?: number;
  }
) {
  const payload = {
    project_id,
    storage_path: photo.storage_path,
    public_url: photo.public_url,
    caption: photo.caption ?? null,
    sort_order: photo.sort_order ?? 0
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
