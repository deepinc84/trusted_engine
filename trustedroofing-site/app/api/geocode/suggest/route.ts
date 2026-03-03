import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const key = process.env.GOOGLE_SECRET_KEY;
  if (!key) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
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

    if (!response.ok) return NextResponse.json({ suggestions: [] });

    const payload = (await response.json()) as {
      status?: string;
      predictions?: Array<{ description?: string }>;
    };

    if (payload.status !== "OK" && payload.status !== "ZERO_RESULTS") {
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions = (payload.predictions ?? [])
      .map((item) => item.description)
      .filter((value): value is string => !!value)
      .slice(0, 6);

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
