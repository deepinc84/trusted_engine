import { NextResponse } from "next/server";

type GeocodePayload = {
  fullAddress: string;
  city: string;
  province: string;
  postal: string;
  lat: number;
  lng: number;
  source: "google" | "nominatim";
};

function getComponent(
  components: Array<{ long_name: string; short_name: string; types: string[] }> | undefined,
  type: string
): string | null {
  if (!components) return null;
  const component = components.find((entry) => entry.types.includes(type));
  return component?.long_name ?? component?.short_name ?? null;
}

async function geocodeWithGoogle(address: string): Promise<GeocodePayload | null> {
  const key = process.env.GOOGLE_SECRET_KEY;
  if (!key) return null;

  const params = new URLSearchParams({ address, key });
  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`, {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as {
    status?: string;
    results?: Array<{
      formatted_address?: string;
      geometry?: { location?: { lat?: number; lng?: number } };
      address_components?: Array<{ long_name: string; short_name: string; types: string[] }>;
    }>;
  };

  if (payload.status !== "OK" || !payload.results?.length) return null;

  const top = payload.results[0];
  const lat = top.geometry?.location?.lat;
  const lng = top.geometry?.location?.lng;
  if (!top.formatted_address || typeof lat !== "number" || typeof lng !== "number") return null;

  return {
    fullAddress: top.formatted_address,
    city:
      getComponent(top.address_components, "locality") ??
      getComponent(top.address_components, "sublocality") ??
      "Calgary",
    province: getComponent(top.address_components, "administrative_area_level_1") ?? "AB",
    postal: getComponent(top.address_components, "postal_code") ?? "",
    lat,
    lng,
    source: "google"
  };
}

async function reverseGeocodeWithGoogle(lat: number, lng: number): Promise<GeocodePayload | null> {
  const key = process.env.GOOGLE_SECRET_KEY;
  if (!key) return null;

  const params = new URLSearchParams({ latlng: `${lat},${lng}`, key });
  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`, {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as {
    status?: string;
    results?: Array<{
      formatted_address?: string;
      address_components?: Array<{ long_name: string; short_name: string; types: string[] }>;
    }>;
  };

  if (payload.status !== "OK" || !payload.results?.length) return null;

  const top = payload.results[0];
  if (!top.formatted_address) return null;

  return {
    fullAddress: top.formatted_address,
    city:
      getComponent(top.address_components, "locality") ??
      getComponent(top.address_components, "sublocality") ??
      "Calgary",
    province: getComponent(top.address_components, "administrative_area_level_1") ?? "AB",
    postal: getComponent(top.address_components, "postal_code") ?? "",
    lat,
    lng,
    source: "google"
  };
}

async function geocodeWithNominatim(address: string): Promise<GeocodePayload | null> {
  const query = new URLSearchParams({
    q: address,
    format: "jsonv2",
    limit: "1",
    addressdetails: "1"
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${query.toString()}`, {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });

  if (!response.ok) return null;

  const [top] = (await response.json()) as Array<{
    display_name?: string;
    lat?: string;
    lon?: string;
    address?: {
      city?: string;
      town?: string;
      village?: string;
      state?: string;
      postcode?: string;
    };
  }>;

  if (!top?.lat || !top?.lon || !top?.display_name) return null;

  return {
    fullAddress: top.display_name,
    city: top.address?.city ?? top.address?.town ?? top.address?.village ?? "Calgary",
    province: top.address?.state ?? "AB",
    postal: top.address?.postcode ?? "",
    lat: Number(top.lat),
    lng: Number(top.lon),
    source: "nominatim"
  };
}

async function reverseGeocodeWithNominatim(lat: number, lng: number): Promise<GeocodePayload | null> {
  const query = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "jsonv2",
    addressdetails: "1"
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${query.toString()}`, {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });

  if (!response.ok) return null;

  const top = (await response.json()) as {
    display_name?: string;
    address?: {
      city?: string;
      town?: string;
      village?: string;
      state?: string;
      postcode?: string;
    };
  };

  if (!top?.display_name) return null;

  return {
    fullAddress: top.display_name,
    city: top.address?.city ?? top.address?.town ?? top.address?.village ?? "Calgary",
    province: top.address?.state ?? "AB",
    postal: top.address?.postcode ?? "",
    lat,
    lng,
    source: "nominatim"
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address")?.trim();
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng);

  if (!address && !hasCoordinates) {
    return NextResponse.json({ error: "address or lat/lng is required" }, { status: 400 });
  }

  try {
    if (hasCoordinates) {
      const googleReverse = await reverseGeocodeWithGoogle(lat, lng);
      if (googleReverse) return NextResponse.json({ ok: true, result: googleReverse });

      const fallbackReverse = await reverseGeocodeWithNominatim(lat, lng);
      if (fallbackReverse) return NextResponse.json({ ok: true, result: fallbackReverse });
      return NextResponse.json({ ok: false, result: null });
    }

    const google = await geocodeWithGoogle(address as string);
    if (google) return NextResponse.json({ ok: true, result: google });

    const fallback = await geocodeWithNominatim(address as string);
    if (fallback) return NextResponse.json({ ok: true, result: fallback });

    return NextResponse.json({ ok: false, result: null });
  } catch {
    return NextResponse.json({ ok: false, result: null });
  }
}
