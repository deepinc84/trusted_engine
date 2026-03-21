import { NextResponse } from "next/server";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { extractQuadrant } from "@/lib/serviceAreas";

type Precision = "neighborhood" | "quadrant" | "city" | "region";
type LocationSource = "edge" | "ip";

type ResolvedLocation = {
  label: string;
  source: LocationSource;
  precision: Precision;
};

type EdgeLocation = {
  city: string | null;
  region: string | null;
  country: string | null;
  postal: string | null;
};

function inferPrecision(parts: {
  neighborhood?: string | null;
  quadrant?: string | null;
  city?: string | null;
  region?: string | null;
}) {
  if (parts.neighborhood) return "neighborhood" as const;
  if (parts.quadrant) return "quadrant" as const;
  if (parts.city) return "city" as const;
  return "region" as const;
}

function buildLabel(parts: {
  neighborhood?: string | null;
  quadrant?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
}) {
  const segments = [parts.neighborhood, parts.quadrant, parts.city, parts.region, parts.country]
    .filter((value): value is string => Boolean(value && value.trim()));

  return segments.join(", ") || "Calgary, AB, Canada";
}

function readFirstHeader(request: Request, names: string[]) {
  for (const name of names) {
    const value = request.headers.get(name)?.trim();
    if (value) return value;
  }
  return null;
}

function resolveFromEdgeHeaders(request: Request): ResolvedLocation | null {
  const edge: EdgeLocation = {
    city: readFirstHeader(request, ["x-vercel-ip-city", "cf-ipcity", "x-appengine-city"]),
    region: readFirstHeader(request, ["x-vercel-ip-country-region", "cf-region-code", "x-appengine-region"]),
    country: readFirstHeader(request, ["x-vercel-ip-country", "cf-ipcountry", "x-appengine-country"]),
    postal: readFirstHeader(request, ["x-vercel-ip-postal-code"])
  };

  if (!edge.city && !edge.region && !edge.country) return null;

  const quadrant = edge.city === "Calgary" && edge.postal
    ? extractQuadrant(edge.postal.replace(/\s+/g, " "))
    : null;

  return {
    label: buildLabel({ city: edge.city, region: edge.region, country: edge.country, quadrant }),
    source: "edge",
    precision: inferPrecision({ city: edge.city, region: edge.region, quadrant })
  };
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
    country_name?: string;
    postal?: string;
  };

  const city = payload.city ?? null;
  const region = payload.region_code ?? null;
  const country = payload.country_name ?? null;
  const quadrant = city === "Calgary" && payload.postal
    ? extractQuadrant(payload.postal.replace(/\s+/g, " "))
    : null;

  if (!city && !region && !country) return null;

  return {
    label: buildLabel({ city, region, country, quadrant }),
    source: "ip",
    precision: inferPrecision({ city, region, quadrant })
  };
}

export async function GET(request: Request) {
  const ip = requestIp(request);
  const rateLimit = checkRateLimit(`location-resolve:${ip}`, 20, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const edgeLocation = resolveFromEdgeHeaders(request);
    const ipLocation = (!edgeLocation && ip && ip !== "unknown") ? await resolveViaIp(ip) : null;
    const location = edgeLocation ?? ipLocation;

    if (!location) {
      return NextResponse.json({ error: "Approximate location could not be resolved." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      location,
      consentRequiredForPreciseLocation: true
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Approximate location could not be resolved."
    }, { status: 500 });
  }
}
