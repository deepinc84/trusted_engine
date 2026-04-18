import { NextResponse } from "next/server";

type SolarInspectRequest = {
  address?: string;
  radiusMeters?: number;
  pixelSizeMeters?: number;
  requiredQuality?: "HIGH" | "MEDIUM" | "LOW" | "BASE";
};

type GeocodePayload = {
  formattedAddress: string;
  location: {
    lat: number;
    lng: number;
  };
};

type EndpointReference = {
  key: string;
  title: string;
  requestUrl: string;
  description: string;
};

type EndpointResult = {
  ok: boolean;
  status: number;
  statusText: string;
  payload: unknown;
  errorSummary: string | null;
};

type GeoTiffAssetRow = {
  layer: string;
  url: string;
  id: string;
  geoTiffRequestUrl: string;
  previewUrl: string;
  available: boolean;
  reason: string;
};

const BASE_ENDPOINT = "https://solar.googleapis.com/v1";

const ENDPOINT_DESCRIPTIONS: EndpointReference[] = [
  {
    key: "buildingInsights",
    title: "buildingInsights:findClosest",
    requestUrl: "",
    description:
      "Finds the nearest mapped building (roughly within 50m) and returns rooftop geometry, solar potential, panel configs, and financial analysis estimates."
  },
  {
    key: "dataLayers",
    title: "dataLayers:get",
    requestUrl: "",
    description:
      "Returns region-level solar rasters and asset URLs (DSM, RGB imagery, mask, annual/monthly flux, and hourly shade tiles) for the selected coordinates."
  },
  {
    key: "geoTiff",
    title: "geoTiff:get",
    requestUrl: "",
    description:
      "Streams a GeoTIFF binary by id. The dataLayers response gives the asset URLs/ids to request through this endpoint."
  }
];

function sanitizeNumber(input: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof input === "number" ? input : Number(input);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

async function geocodeAddress(address: string, key: string): Promise<GeocodePayload> {
  const geocodeParams = new URLSearchParams({ address, key });

  const geocodeResponse = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?${geocodeParams.toString()}`,
    {
      headers: { Accept: "application/json" },
      cache: "no-store"
    }
  );

  if (!geocodeResponse.ok) {
    throw new Error(`Google Geocoding HTTP error (${geocodeResponse.status} ${geocodeResponse.statusText}).`);
  }

  const geocodePayload = (await geocodeResponse.json()) as {
    status?: string;
    error_message?: string;
    results?: Array<{
      formatted_address?: string;
      geometry?: {
        location?: {
          lat?: number;
          lng?: number;
        };
      };
    }>;
  };

  const result = geocodePayload.results?.[0];
  const lat = result?.geometry?.location?.lat;
  const lng = result?.geometry?.location?.lng;

  if (geocodePayload.status !== "OK" || typeof lat !== "number" || typeof lng !== "number") {
    const detail = geocodePayload.error_message ?? geocodePayload.status ?? "Unknown geocode failure.";
    throw new Error(`Could not geocode address: ${detail}`);
  }

  return {
    formattedAddress: result?.formatted_address ?? address,
    location: { lat, lng }
  };
}

function buildSolarUrl(path: string, params: URLSearchParams) {
  return `${BASE_ENDPOINT}${path}?${params.toString()}`;
}

function getGeoTiffId(url: string) {
  try {
    const value = new URL(url).searchParams.get("id");
    return value ?? "";
  } catch {
    return "";
  }
}

function getErrorSummary(payload: unknown, fallback: string) {
  if (typeof payload === "string" && payload.trim()) return payload;
  if (!payload || typeof payload !== "object") return fallback;

  const record = payload as Record<string, unknown>;
  const errorObj = record.error;
  if (errorObj && typeof errorObj === "object") {
    const message = (errorObj as Record<string, unknown>).message;
    const status = (errorObj as Record<string, unknown>).status;
    const code = (errorObj as Record<string, unknown>).code;
    const pieces = [code, status, message].filter((piece) => typeof piece === "string" || typeof piece === "number");
    if (pieces.length) return pieces.join(" | ");
  }

  if (typeof record.message === "string") return record.message;
  return fallback;
}

async function fetchSolarJson(requestUrl: string): Promise<EndpointResult> {
  const response = await fetch(requestUrl, {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });

  const payload = await response.json().catch(() => ({}));
  const fallback = `Solar API error (${response.status} ${response.statusText || "unknown"}).`;

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    payload,
    errorSummary: response.ok ? null : getErrorSummary(payload, fallback)
  };
}

function toGeoTiffAssetRows(dataLayers: Record<string, unknown>, apiKey: string): GeoTiffAssetRow[] {
  const rows: GeoTiffAssetRow[] = [];

  const addRow = (layer: string, value: unknown) => {
    if (typeof value !== "string" || !value) {
      rows.push({
        layer,
        url: "",
        id: "",
        geoTiffRequestUrl: "",
        previewUrl: "",
        available: false,
        reason: "Layer URL missing from dataLayers response for this location/settings."
      });
      return;
    }

    const id = getGeoTiffId(value);
    const hasId = Boolean(id);

    rows.push({
      layer,
      url: value,
      id,
      geoTiffRequestUrl: hasId
        ? buildSolarUrl("/geoTiff:get", new URLSearchParams({ id, key: apiKey }))
        : "",
      previewUrl: layer === "rgbUrl" && hasId
        ? `/api/solar/rgb-preview?assetId=${encodeURIComponent(id)}`
        : "",
      available: true,
      reason: hasId
        ? "Available."
        : "Layer URL is present but an `id` query param could not be parsed for geoTiff:get."
    });
  };

  addRow("dsmUrl", dataLayers.dsmUrl);
  addRow("rgbUrl", dataLayers.rgbUrl);
  addRow("maskUrl", dataLayers.maskUrl);
  addRow("annualFluxUrl", dataLayers.annualFluxUrl);
  addRow("monthlyFluxUrl", dataLayers.monthlyFluxUrl);

  const hourlyShadeUrls = dataLayers.hourlyShadeUrls;
  if (Array.isArray(hourlyShadeUrls) && hourlyShadeUrls.length) {
    hourlyShadeUrls.forEach((value, index) => addRow(`hourlyShadeUrls[${index}]`, value));
  } else {
    for (let index = 0; index < 24; index += 1) {
      addRow(`hourlyShadeUrls[${index}]`, undefined);
    }
  }

  return rows;
}

export async function POST(request: Request) {
  const secret = process.env.GOOGLE_SECRET_KEY;

  if (!secret) {
    return NextResponse.json(
      { error: "GOOGLE_SECRET_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as SolarInspectRequest;

  if (!body.address?.trim()) {
    return NextResponse.json({ error: "Please provide an address." }, { status: 400 });
  }

  const radiusMeters = sanitizeNumber(body.radiusMeters, 100, 1, 175);
  const pixelSizeMeters = sanitizeNumber(body.pixelSizeMeters, 0.5, 0.1, 1);
  const requiredQuality = body.requiredQuality ?? "HIGH";

  try {
    const geocoded = await geocodeAddress(body.address, secret);

    const buildingParams = new URLSearchParams({
      "location.latitude": String(geocoded.location.lat),
      "location.longitude": String(geocoded.location.lng),
      requiredQuality,
      exactQualityRequired: "false",
      key: secret
    });

    const dataLayersParams = new URLSearchParams({
      "location.latitude": String(geocoded.location.lat),
      "location.longitude": String(geocoded.location.lng),
      radiusMeters: String(radiusMeters),
      pixelSizeMeters: String(pixelSizeMeters),
      view: "FULL_LAYERS",
      requiredQuality,
      exactQualityRequired: "false",
      key: secret
    });

    const buildingInsightsUrl = buildSolarUrl("/buildingInsights:findClosest", buildingParams);
    const dataLayersUrl = buildSolarUrl("/dataLayers:get", dataLayersParams);

    const [buildingInsightsResult, dataLayersResult] = await Promise.all([
      fetchSolarJson(buildingInsightsUrl),
      fetchSolarJson(dataLayersUrl)
    ]);

    const endpointReferences = ENDPOINT_DESCRIPTIONS.map((item) => {
      if (item.key === "buildingInsights") return { ...item, requestUrl: buildingInsightsUrl };
      if (item.key === "dataLayers") return { ...item, requestUrl: dataLayersUrl };
      return { ...item, requestUrl: `${BASE_ENDPOINT}/geoTiff:get?id=ASSET_ID&key=YOUR_API_KEY` };
    });

    const dataLayersPayload =
      dataLayersResult.ok && dataLayersResult.payload && typeof dataLayersResult.payload === "object"
        ? (dataLayersResult.payload as Record<string, unknown>)
        : {};

    const geoTiffAssets = toGeoTiffAssetRows(dataLayersPayload, secret);

    return NextResponse.json(
      {
        addressInput: body.address,
        geocode: geocoded,
        settings: {
          radiusMeters,
          pixelSizeMeters,
          requiredQuality
        },
        endpointReferences,
        responses: {
          buildingInsights: buildingInsightsResult,
          dataLayers: dataLayersResult
        },
        geoTiffAssets,
        fieldGuide: {
          buildingInsights: {
            name: "Unique building insight resource name.",
            center: "Latitude/longitude point used as the building center.",
            imageryDate: "Date of source imagery used for this analysis.",
            imageryQuality: "Imagery quality tier used in the analysis.",
            solarPotential: "Top-level rooftop solar metrics and optimization outputs."
          },
          solarPotential: {
            maxArrayPanelsCount: "Maximum number of panels on the modeled roof.",
            maxArrayAreaMeters2: "Maximum total usable panel area in square meters.",
            maxSunshineHoursPerYear: "Estimated annual sun-hours for the best array.",
            maxArrayEnergyProductionKwhYear: "Estimated yearly energy for max panel layout.",
            wholeRoofStats: "Sun and area stats aggregated for the full rooftop.",
            roofSegmentStats: "Per-roof-plane geometry and sunshine statistics.",
            solarPanelConfigs: "Panel layout options ranked by generation potential.",
            financialAnalyses: "Savings projections for cash, financed, and leased scenarios."
          },
          dataLayers: {
            dsmUrl: "Digital surface model raster URL (elevation model).",
            rgbUrl: "RGB imagery raster URL (visual context).",
            maskUrl: "Mask raster URL showing analysis coverage.",
            annualFluxUrl: "Annual solar flux raster URL.",
            monthlyFluxUrl: "Monthly solar flux raster URL.",
            hourlyShadeUrls: "24 raster URLs representing hourly shade conditions."
          }
        }
      },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected solar inspection failure.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
