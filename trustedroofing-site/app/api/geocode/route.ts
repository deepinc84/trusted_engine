import { NextResponse } from "next/server";

type GeocodePayload = {
  fullAddress: string;
  city: string;
  province: string;
  postal: string;
  neighborhood: string;
  quadrant: "NE" | "NW" | "SE" | "SW" | "";
  lat: number;
  lng: number;
  source: "google" | "nominatim";
};

type GoogleAddressComponent = { long_name: string; short_name: string; types: string[] };

function getComponent(
  components: GoogleAddressComponent[] | undefined,
  type: string
): string | null {
  if (!components) return null;
  const component = components.find((entry) => entry.types.includes(type));
  return component?.long_name ?? component?.short_name ?? null;
}

function inferQuadrant(value: string) {
  const source = value.toUpperCase();
  if (/\bSOUTH\s*EAST\b|\bSOUTHEAST\b|\bSE\b/.test(source)) return "SE" as const;
  if (/\bSOUTH\s*WEST\b|\bSOUTHWEST\b|\bSW\b/.test(source)) return "SW" as const;
  if (/\bNORTH\s*EAST\b|\bNORTHEAST\b|\bNE\b/.test(source)) return "NE" as const;
  if (/\bNORTH\s*WEST\b|\bNORTHWEST\b|\bNW\b/.test(source)) return "NW" as const;
  return "" as const;
}

function getGoogleNeighborhood(components: GoogleAddressComponent[] | undefined) {
  return (
    getComponent(components, "neighborhood") ??
    getComponent(components, "sublocality_level_1") ??
    getComponent(components, "sublocality_level_2") ??
    getComponent(components, "sublocality") ??
    ""
  );
}

function normalizeResult(base: {
  fullAddress: string;
  city: string;
  province: string;
  postal: string;
  neighborhood: string;
  lat: number;
  lng: number;
  source: "google" | "nominatim";
}): GeocodePayload {
  const quadrant = inferQuadrant(`${base.fullAddress} ${base.neighborhood}`);
  const neighborhood =
    base.neighborhood && base.neighborhood.toLowerCase() !== base.city.toLowerCase()
      ? base.neighborhood
      : "";

  return {
    ...base,
    neighborhood,
    quadrant
  };
}

function buildCoordinateFallback(lat: number, lng: number): GeocodePayload {
  const roundedLat = lat.toFixed(6);
  const roundedLng = lng.toFixed(6);
  const fallbackAddress = `${roundedLat}, ${roundedLng} (approximate)`;
  return normalizeResult({
    fullAddress: fallbackAddress,
    city: "Calgary",
    province: "AB",
    postal: "",
    neighborhood: "",
    lat,
    lng,
    source: "nominatim"
  });
}

async function geocodeWithGoogle(address: string): Promise<GeocodePayload | null> {
  const key = process.env.GOOGLE_SECRET_KEY;
  if (!key) return null;

  const params = new URLSearchParams({
    address,
    key,
    region: "ca",
    components: "country:CA"
  });
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
      address_components?: GoogleAddressComponent[];
    }>;
  };

  if (payload.status !== "OK" || !payload.results?.length) return null;

  const top = payload.results[0];
  const lat = top.geometry?.location?.lat;
  const lng = top.geometry?.location?.lng;
  if (!top.formatted_address || typeof lat !== "number" || typeof lng !== "number") return null;

  return normalizeResult({
    fullAddress: top.formatted_address,
    city: getComponent(top.address_components, "locality") ?? "Calgary",
    province: getComponent(top.address_components, "administrative_area_level_1") ?? "AB",
    postal: getComponent(top.address_components, "postal_code") ?? "",
    neighborhood: getGoogleNeighborhood(top.address_components),
    lat,
    lng,
    source: "google"
  });
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
      address_components?: GoogleAddressComponent[];
    }>;
  };

  if (payload.status !== "OK" || !payload.results?.length) return null;

  const top = payload.results[0];
  if (!top.formatted_address) return null;

  return normalizeResult({
    fullAddress: top.formatted_address,
    city: getComponent(top.address_components, "locality") ?? "Calgary",
    province: getComponent(top.address_components, "administrative_area_level_1") ?? "AB",
    postal: getComponent(top.address_components, "postal_code") ?? "",
    neighborhood: getGoogleNeighborhood(top.address_components),
    lat,
    lng,
    source: "google"
  });
}

async function geocodeWithNominatim(address: string): Promise<GeocodePayload | null> {
  const query = new URLSearchParams({
    q: `${address}, Calgary, AB, Canada`,
    format: "jsonv2",
    limit: "1",
    addressdetails: "1"
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${query.toString()}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "trustedroofing-admin/1.0"
    },
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
      neighbourhood?: string;
      suburb?: string;
      city_district?: string;
    };
  }>;

  if (!top?.lat || !top?.lon || !top?.display_name) return null;

  return normalizeResult({
    fullAddress: top.display_name,
    city: top.address?.city ?? top.address?.town ?? top.address?.village ?? "Calgary",
    province: top.address?.state ?? "AB",
    postal: top.address?.postcode ?? "",
    neighborhood: top.address?.neighbourhood ?? top.address?.suburb ?? top.address?.city_district ?? "",
    lat: Number(top.lat),
    lng: Number(top.lon),
    source: "nominatim"
  });
}

async function reverseGeocodeWithNominatim(lat: number, lng: number): Promise<GeocodePayload | null> {
  const query = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "jsonv2",
    addressdetails: "1"
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${query.toString()}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "trustedroofing-admin/1.0"
    },
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
      neighbourhood?: string;
      suburb?: string;
      city_district?: string;
    };
  };

  if (!top?.display_name) return null;

  return normalizeResult({
    fullAddress: top.display_name,
    city: top.address?.city ?? top.address?.town ?? top.address?.village ?? "Calgary",
    province: top.address?.state ?? "AB",
    postal: top.address?.postcode ?? "",
    neighborhood: top.address?.neighbourhood ?? top.address?.suburb ?? top.address?.city_district ?? "",
    lat,
    lng,
    source: "nominatim"
  });
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

      const nominatimReverse = await reverseGeocodeWithNominatim(lat, lng);
      if (nominatimReverse) return NextResponse.json({ ok: true, result: nominatimReverse });

      return NextResponse.json(
        {
          error: "No reverse geocode result found",
          detail: {
            attempted: ["google", "nominatim"],
            lat,
            lng
          }
        },
        { status: 404 }
      );
    }

    if (!address) {
      return NextResponse.json({ error: "address is required" }, { status: 400 });
    }

    const googleResult = await geocodeWithGoogle(address);
    if (googleResult) return NextResponse.json({ ok: true, result: googleResult });

    const nominatimResult = await geocodeWithNominatim(address);
    if (nominatimResult) return NextResponse.json({ ok: true, result: nominatimResult });

    return NextResponse.json(
      {
        error: "No geocode result found",
        detail: {
          attempted: ["google", "nominatim"],
          address
        }
      },
      { status: 404 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Geocode lookup failed";
    const isGoogleAuthError = message.toLowerCase().includes("request denied")
      || message.toLowerCase().includes("api key")
      || message.toLowerCase().includes("billing");
    return NextResponse.json(
      {
        error: "Geocode lookup failed",
        detail: message
      },
      { status: isGoogleAuthError ? 502 : 500 }
    );
  }
}
