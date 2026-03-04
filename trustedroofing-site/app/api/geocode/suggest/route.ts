import { NextResponse } from "next/server";

async function googleSuggest(q: string) {
  const key = process.env.GOOGLE_SECRET_KEY;
  if (!key) return [] as string[];

  const params = new URLSearchParams({
    input: q,
    key,
    types: "address",
    components: "country:ca"
  });

  const response = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`, {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });

  if (!response.ok) return [] as string[];

  const payload = (await response.json()) as {
    status?: string;
    predictions?: Array<{ description?: string }>;
  };

  if (payload.status !== "OK" && payload.status !== "ZERO_RESULTS") {
    return [] as string[];
  }

  return (payload.predictions ?? [])
    .map((item) => item.description)
    .filter((value): value is string => !!value)
    .slice(0, 8);
}

async function nominatimSuggest(q: string) {
  const params = new URLSearchParams({
    q: `${q}, Calgary, AB, Canada`,
    format: "jsonv2",
    addressdetails: "1",
    limit: "8"
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: {
      "User-Agent": "TrustedRoofing/1.0",
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) return [] as string[];

  const payload = (await response.json()) as Array<{ display_name?: string }>;
  return payload
    .map((item) => item.display_name)
    .filter((value): value is string => !!value)
    .slice(0, 8);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const google = await googleSuggest(q);
    if (google.length > 0) {
      return NextResponse.json({ suggestions: google });
    }

    const fallback = await nominatimSuggest(q);
    return NextResponse.json({ suggestions: fallback });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
