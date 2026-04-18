"use client";

import { FormEvent, useMemo, useState } from "react";

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

type SolarInspectResponse = {
  addressInput: string;
  geocode: {
    formattedAddress: string;
    location: {
      lat: number;
      lng: number;
    };
  };
  settings: {
    radiusMeters: number;
    pixelSizeMeters: number;
    requiredQuality: string;
  };
  endpointReferences: EndpointReference[];
  responses: {
    buildingInsights: EndpointResult;
    dataLayers: EndpointResult;
  };
  geoTiffAssets: Array<{
    layer: string;
    url: string;
    id: string;
    geoTiffRequestUrl: string;
    previewUrl: string;
    available: boolean;
    reason: string;
  }>;
  fieldGuide: Record<string, Record<string, string>>;
  error?: string;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function formatValue(value: unknown): string {
  if (typeof value === "number") return Number(value).toLocaleString();
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function JsonTree({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (!isObject(value) && !Array.isArray(value)) {
    return <span className="solar-debug-leaf">{formatValue(value)}</span>;
  }

  if (Array.isArray(value)) {
    return (
      <div className="solar-debug-tree" style={{ marginLeft: depth ? 14 : 0 }}>
        {value.map((item, index) => (
          <details key={`${index}-${typeof item}`} className="solar-debug-details" open={depth < 1}>
            <summary>
              <strong>[{index}]</strong>
            </summary>
            <JsonTree value={item} depth={depth + 1} />
          </details>
        ))}
      </div>
    );
  }

  const entries = Object.entries(value);
  return (
    <div className="solar-debug-tree" style={{ marginLeft: depth ? 14 : 0 }}>
      {entries.map(([key, entryValue]) => {
        const nested = isObject(entryValue) || Array.isArray(entryValue);
        if (!nested) {
          return (
            <div key={key} className="solar-debug-row">
              <span className="solar-debug-key">{key}</span>
              <span className="solar-debug-leaf">{formatValue(entryValue)}</span>
            </div>
          );
        }

        return (
          <details key={key} className="solar-debug-details" open={depth < 1}>
            <summary>
              <strong>{key}</strong>
            </summary>
            <JsonTree value={entryValue} depth={depth + 1} />
          </details>
        );
      })}
    </div>
  );
}

function FieldGuide({ data }: { data: Record<string, Record<string, string>> }) {
  return (
    <div className="card solar-debug-card">
      <h2>Field descriptions</h2>
      <p className="solar-debug-muted">Quick guide to the most useful Solar API datapoints.</p>
      <div className="solar-guide-grid">
        {Object.entries(data).map(([section, values]) => (
          <article key={section} className="solar-guide-block">
            <h3>{section}</h3>
            <ul>
              {Object.entries(values).map(([field, description]) => (
                <li key={field}>
                  <code>{field}</code>
                  <span>{description}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}

function EndpointStatus({ name, result }: { name: string; result: EndpointResult }) {
  return (
    <div className={`solar-endpoint-status ${result.ok ? "solar-endpoint-status--ok" : "solar-endpoint-status--error"}`}>
      <strong>{name}:</strong> {result.status} {result.statusText || "Unknown"}
      {!result.ok && result.errorSummary ? <p>{result.errorSummary}</p> : null}
    </div>
  );
}

export default function SolarDebugClient() {
  const [address, setAddress] = useState("1600 Amphitheatre Parkway, Mountain View, CA");
  const [radiusMeters, setRadiusMeters] = useState(100);
  const [pixelSizeMeters, setPixelSizeMeters] = useState(0.5);
  const [status, setStatus] = useState("Ready.");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SolarInspectResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const endpointRows = useMemo(() => result?.endpointReferences ?? [], [result]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("Calling geocode + Solar endpoints...");
    setError(null);

    try {
      const response = await fetch("/api/solar/inspect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ address, radiusMeters, pixelSizeMeters })
      });

      const payload = (await response.json()) as SolarInspectResponse;

      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? `Solar inspector request failed (${response.status}).`);
      }

      setResult(payload);
      setStatus("Done. Data loaded.");
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Unexpected request error.";
      setError(message);
      setStatus("Request failed.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="solar-debug-stack">
      <form className="card solar-debug-card form-grid" onSubmit={onSubmit}>
        <h2>Run a Solar API inspection</h2>
        <p className="solar-debug-muted">This page is for internal testing only and is configured as noindex.</p>

        <label>
          Address
          <input
            className="input solar-debug-input"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Enter a full street address"
            required
          />
        </label>

        <div className="solar-debug-split">
          <label>
            Radius meters (1-175)
            <input
              className="input solar-debug-input"
              type="number"
              min={1}
              max={175}
              step={1}
              value={radiusMeters}
              onChange={(event) => setRadiusMeters(Number(event.target.value))}
            />
          </label>
          <label>
            Pixel size meters (0.1-1)
            <input
              className="input solar-debug-input"
              type="number"
              min={0.1}
              max={1}
              step={0.1}
              value={pixelSizeMeters}
              onChange={(event) => setPixelSizeMeters(Number(event.target.value))}
            />
          </label>
        </div>

        <div className="solar-debug-actions">
          <button className="button" type="submit" disabled={loading}>
            {loading ? "Running..." : "Run inspection"}
          </button>
          <span className="solar-debug-muted">{status}</span>
        </div>

        {error ? <p className="admin-status admin-status--error">{error}</p> : null}
      </form>

      {result ? (
        <>
          <div className="card solar-debug-card">
            <h2>Endpoint calls</h2>
            <p className="solar-debug-muted">These are the exact request URLs generated for this address.</p>
            <div className="solar-endpoint-grid">
              {endpointRows.map((entry) => (
                <article className="solar-endpoint" key={entry.key}>
                  <h3>{entry.title}</h3>
                  <p>{entry.description}</p>
                  <code>{entry.requestUrl}</code>
                </article>
              ))}
            </div>
          </div>

          <div className="card solar-debug-card">
            <h2>Endpoint response health</h2>
            <p className="solar-debug-muted">Shows HTTP status plus error details returned by Solar API.</p>
            <div className="solar-endpoint-health-grid">
              <EndpointStatus name="buildingInsights" result={result.responses.buildingInsights} />
              <EndpointStatus name="dataLayers" result={result.responses.dataLayers} />
            </div>
          </div>

          <FieldGuide data={result.fieldGuide} />

          <div className="card solar-debug-card">
            <h2>GeoTIFF/Image options</h2>
            <p className="solar-debug-muted">
              Each row now attempts to render the image directly on-screen. Missing or non-renderable rows include a reason so you can see why the layer did not load.
            </p>
            <div className="solar-assets-grid">
              {result.geoTiffAssets.map((asset) => (
                <article key={`${asset.layer}-${asset.id || "none"}`} className="solar-asset-row">
                  <strong>{asset.layer}</strong>
                  <span className={asset.available ? "solar-asset-ok" : "solar-asset-missing"}>
                    {asset.available ? "Available" : "Missing"}
                  </span>
                  <span>{asset.reason}</span>
                  <span>ID: {asset.id || "(missing)"}</span>
                  {asset.available && asset.previewUrl ? (
                    <img
                      className="solar-asset-image"
                      src={asset.previewUrl}
                      alt={`${asset.layer} preview`}
                      loading="lazy"
                    />
                  ) : null}
                  {asset.url ? (
                    <a href={asset.url} target="_blank" rel="noreferrer">
                      Open asset URL
                    </a>
                  ) : null}
                  {asset.geoTiffRequestUrl ? (
                    <a href={asset.geoTiffRequestUrl} target="_blank" rel="noreferrer">
                      Open geoTiff:get URL
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          </div>

          <div className="card solar-debug-card">
            <h2>Building insights response</h2>
            <p className="solar-debug-muted">Status: {result.responses.buildingInsights.status}</p>
            <JsonTree value={result.responses.buildingInsights.payload} />
          </div>

          <div className="card solar-debug-card">
            <h2>Data layers response</h2>
            <p className="solar-debug-muted">Status: {result.responses.dataLayers.status}</p>
            <JsonTree value={result.responses.dataLayers.payload} />
          </div>
        </>
      ) : null}
    </div>
  );
}
