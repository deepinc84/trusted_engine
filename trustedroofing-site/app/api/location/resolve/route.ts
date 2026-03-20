import { NextResponse } from "next/server";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { extractQuadrant } from "@/lib/serviceAreas";

type Precision = "street" | "neighborhood" | "quadrant" | "city";

type ResolvedLocation = {
  label: string;
  source: "ip" | "google";
  precision: Precision;
};

type GoogleAddressComponent = { long_name: string; short_name: string; types: string[] };

function precisionScore(value: Precision) {
  if (value === "street") return 4;
  if (value === "neighborhood") return 3;
  if (value === "quadrant") return 2;
  return 1;
}

function getComponent(components: GoogleAddressComponent[] | undefined, type: string) {
  const component = components?.find((entry) => entry.types.includes(type));
  return component?.long_name ?? component?.short_name ?? null;
}

function inferPrecision(parts: {
  fullAddress?: string | null;
  neighborhood?: string | null;
  quadrant?: string | null;
  city?: string | null;
}) {
  if (parts.fullAddress && /\d/.test(parts.fullAddress)) return "street" as const;
  if (parts.neighborhood) return "neighborhood" as const;
  if (parts.quadrant) return "quadrant" as const;
  return "city" as const;
}

function buildLabel(parts: {
  fullAddress?: string | null;
  neighborhood?: string | null;
  quadrant?: string | null;
  city?: string | null;
}) {
  return parts.fullAddress
    ?? [parts.neighborhood, parts.quadrant, parts.city].filter(Boolean).join(", ")
    ?? parts.city
    ?? "Calgary";
}

async function resolveViaIp(ip: string): Promise<ResolvedLocation | null> {
  const response = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as {
    city?: string;
    region_code?: string;
    postal?: string;
    latitude?: number;
    longitude?: number;
  };

  const city = payload.city ?? null;
  const quadrant = city === "Calgary" && payload.postal
    ? extractQuadrant(payload.postal.replace(/\s+/g, " "))
    : null;
  const label = [city, payload.region_code ?? "AB", payload.postal].filter(Boolean).join(", ");
  const precision = inferPrecision({ quadrant, city, fullAddress: null, neighborhood: null });

  return city ? {
    label: label || city,
    source: "ip",
    precision
  } : null;
}

async function reverseGeocodeGoogle(lat: number, lng: number) {
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
  const neighborhood =
    getComponent(top.address_components, "neighborhood")
    ?? getComponent(top.address_components, "sublocality_level_1")
    ?? getComponent(top.address_components, "sublocality")
    ?? null;
  const city = getComponent(top.address_components, "locality") ?? "Calgary";
  const quadrant = extractQuadrant(top.formatted_address ?? "");
  const precision = inferPrecision({
    fullAddress: top.formatted_address ?? null,
    neighborhood,
    quadrant,
    city
  });

  return {
    label: buildLabel({
      fullAddress: top.formatted_address ?? null,
      neighborhood,
      quadrant,
      city
    }),
    source: "google" as const,
    precision
  };
}

async function resolveViaGoogle() {
  const key = process.env.GOOGLE_SECRET_KEY;
  if (!key) return null;

  const response = await fetch(`https://www.googleapis.com/geolocation/v1/geolocate?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ considerIp: true }),
    cache: "no-store"
  });

  if (!response.ok) return null;
  const payload = (await response.json()) as {
    location?: { lat?: number; lng?: number };
  };

  const lat = payload.location?.lat;
  const lng = payload.location?.lng;
  if (typeof lat !== "number" || typeof lng !== "number") return null;

  return reverseGeocodeGoogle(lat, lng);
}

export async function GET(request: Request) {
  const ip = requestIp(request);
  const rateLimit = checkRateLimit(`location-resolve:${ip}`, 20, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const ipLocation = ip && ip !== "unknown" ? await resolveViaIp(ip) : null;
    const needsGoogleFallback = !ipLocation || precisionScore(ipLocation.precision) < precisionScore("neighborhood");
    const googleLocation = needsGoogleFallback ? await resolveViaGoogle() : null;

    const location = googleLocation && (!ipLocation || precisionScore(googleLocation.precision) >= precisionScore(ipLocation.precision))
      ? googleLocation
      : ipLocation;

    if (!location) {
      return NextResponse.json({ error: "Location could not be resolved." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, location });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Location could not be resolved."
    }, { status: 500 });
  }
}
