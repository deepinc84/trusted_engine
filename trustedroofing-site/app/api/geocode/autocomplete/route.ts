import { NextResponse } from "next/server";

type Suggestion = {
  label: string;
  place_id?: string | null;
};

async function googleAutocomplete(input: string): Promise<Suggestion[]> {
  const key = process.env.GOOGLE_SECRET_KEY;
  if (!key) return [];

  const params = new URLSearchParams({
    input,
    key,
    components: "country:ca",
    types: "address"
  });

  const response = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`, {
    cache: "no-store",
    headers: { Accept: "application/json" }
  });

  if (!response.ok) return [];

  const payload = (await response.json()) as {
    status?: string;
    predictions?: Array<{ description?: string; place_id?: string }>;
  };

  if (payload.status !== "OK" && payload.status !== "ZERO_RESULTS") return [];

  return (payload.predictions ?? [])
    .map((row) => ({
      label: row.description ?? "",
      place_id: row.place_id ?? null
    }))
    .filter((row) => row.label.length > 0)
    .slice(0, 6);
}

async function nominatimAutocomplete(input: string): Promise<Suggestion[]> {
  const params = new URLSearchParams({
    q: input,
    format: "jsonv2",
    addressdetails: "1",
    limit: "6",
    countrycodes: "ca"
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent": "trustedroofing-admin/1.0"
    }
  });

  if (!response.ok) return [];

  const payload = (await response.json()) as Array<{ display_name?: string; place_id?: string | number }>;

  return payload
    .map((row) => ({
      label: row.display_name ?? "",
      place_id: row.place_id != null ? String(row.place_id) : null
    }))
    .filter((row) => row.label.length > 0)
    .slice(0, 6);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const google = await googleAutocomplete(q);
    if (google.length > 0) {
      return NextResponse.json({ suggestions: google, source: "google" });
    }

    const fallback = await nominatimAutocomplete(q);
    return NextResponse.json({ suggestions: fallback, source: "nominatim" });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
