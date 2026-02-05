import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { roundLatLng, sanitizePublicProject } from "./sanitize";
import { distanceInKm } from "./geo";

export type Project = {
  slug: string;
  title: string;
  service_type: string;
  neighborhood: string;
  city: string;
  province: string;
  sanitized_geo: { lat: number; lng: number };
  summary: string;
  description: string;
  completed_at: string;
  images: string[];
};

export type QuoteEvent = {
  id: string;
  address: string;
  city: string;
  province: string;
  postal: string;
  lat: number;
  lng: number;
  estimate_low: number;
  estimate_high: number;
  service_type: string;
  name?: string;
  phone?: string;
  email?: string;
  preferred_contact?: string;
  created_at: string;
};

const mockProjects: Project[] = [
  {
    slug: "signal-hill-roof-replacement",
    title: "Signal Hill roof replacement",
    service_type: "Roofing",
    neighborhood: "Signal Hill",
    city: "Calgary",
    province: "AB",
    sanitized_geo: roundLatLng({ lat: 51.018, lng: -114.146 }),
    summary: "Class 4 impact-resistant shingles with new underlayment.",
    description:
      "We completed a full tear-off, installed ice and water shield, and upgraded vents for improved airflow.",
    completed_at: "2024-04-12",
    images: ["/projects/project-1.svg"]
  },
  {
    slug: "mahogany-storm-repair",
    title: "Mahogany storm repair",
    service_type: "Roof repair",
    neighborhood: "Mahogany",
    city: "Calgary",
    province: "AB",
    sanitized_geo: roundLatLng({ lat: 50.894, lng: -113.93 }),
    summary: "Emergency storm patching and shingle replacement.",
    description:
      "Rapid response repair completed within 24 hours to secure the roof and prevent water intrusion.",
    completed_at: "2024-05-08",
    images: ["/projects/project-2.svg"]
  },
  {
    slug: "bridgeland-exterior-refresh",
    title: "Bridgeland exterior refresh",
    service_type: "Exteriors",
    neighborhood: "Bridgeland",
    city: "Calgary",
    province: "AB",
    sanitized_geo: roundLatLng({ lat: 51.048, lng: -114.032 }),
    summary: "Soffit, fascia, and gutter replacement with custom colors.",
    description:
      "Updated the envelope with new aluminum accessories and inspected attic airflow while onsite.",
    completed_at: "2024-03-02",
    images: ["/projects/project-3.svg"]
  }
];

let supabase: SupabaseClient | null = null;

const isSupabaseEnabled =
  !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY;

// TODO: build an admin ingestion pipeline for project data updates.


function getSupabaseClient() {
  if (!isSupabaseEnabled) return null;
  if (!supabase) {
    supabase = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
    );
  }
  return supabase;
}

export async function listProjects(params?: {
  service_type?: string | null;
  limit?: number | null;
  near_lat?: number | null;
  near_lng?: number | null;
}): Promise<Project[]> {
  if (isSupabaseEnabled) {
    const client = getSupabaseClient();
    if (client) {
      const { data } = await client
        .from("projects")
        .select("*")
        .limit(params?.limit ?? 12);
      // TODO: apply filters and distance sorting in SQL.
      return (data ?? []).map((project) =>
        sanitizePublicProject(project as Project)
      );
    }
  }

  let results = [...mockProjects];
  if (params?.service_type) {
    results = results.filter(
      (project) => project.service_type === params.service_type
    );
  }
  if (params?.near_lat && params?.near_lng) {
    results = results
      .map((project) => ({
        project,
        distance: distanceInKm(
          params.near_lat as number,
          params.near_lng as number,
          project.sanitized_geo.lat,
          project.sanitized_geo.lng
        )
      }))
      .sort((a, b) => a.distance - b.distance)
      .map((entry) => entry.project);
  }
  if (params?.limit) {
    results = results.slice(0, params.limit);
  }
  return results.map((project) => sanitizePublicProject(project));
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  if (isSupabaseEnabled) {
    const client = getSupabaseClient();
    if (client) {
      const { data } = await client
        .from("projects")
        .select("*")
        .eq("slug", slug)
        .single();
      return data ? sanitizePublicProject(data as Project) : null;
    }
  }
  const project = mockProjects.find((item) => item.slug === slug);
  return project ? sanitizePublicProject(project) : null;
}

const mockQuoteEvents: QuoteEvent[] = [];

export async function createQuoteStep1(input: Omit<QuoteEvent, "id" | "created_at">) {
  const quote = {
    ...input,
    id: `quote_${Date.now()}`,
    created_at: new Date().toISOString()
  };

  if (isSupabaseEnabled) {
    const client = getSupabaseClient();
    if (client) {
      await client.from("quote_events").insert(quote);
      return quote.id;
    }
  }

  mockQuoteEvents.push(quote);
  return quote.id;
}

export async function updateQuoteStep2(input: {
  quote_id: string;
  name: string;
  phone: string;
  email: string;
  preferred_contact: string;
}) {
  if (isSupabaseEnabled) {
    const client = getSupabaseClient();
    if (client) {
      await client
        .from("quote_events")
        .update({
          name: input.name,
          phone: input.phone,
          email: input.email,
          preferred_contact: input.preferred_contact
        })
        .eq("id", input.quote_id);
      return true;
    }
  }

  const event = mockQuoteEvents.find((item) => item.id === input.quote_id);
  if (event) {
    event.name = input.name;
    event.phone = input.phone;
    event.email = input.email;
    event.preferred_contact = input.preferred_contact;
  }
  return true;
}
