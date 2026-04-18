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
    proxyGeoTiffUrl: string;
    available: boolean;
    reason: string;
  }>;
  fieldGuide: Record<string, Record<string, string>>;
  error?: string;
};

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

function buildFullReport(result: SolarInspectResponse) {
  return JSON.stringify(
    {
      meta: {
        addressInput: result.addressInput,
        geocode: result.geocode,
        settings: result.settings,
        endpoints: result.endpointReferences
      },
      fieldGuide: result.fieldGuide,
      responses: result.responses,
      geoTiffAssets: result.geoTiffAssets
    },
    null,
    2
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
  const fullReport = useMemo(() => (result ? buildFullReport(result) : ""), [result]);

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
              GeoTIFF downloads are now proxied through this app so your server key is used instead of
              an unauthenticated mobile browser call.
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
                  {asset.url ? (
                    <a href={asset.url} target="_blank" rel="noreferrer">
                      Open raw asset URL (Google)
                    </a>
                  ) : null}
                  {asset.proxyGeoTiffUrl ? (
                    <a href={asset.proxyGeoTiffUrl} target="_blank" rel="noreferrer">
                      Open proxied GeoTIFF (no 403 key issue)
                    </a>
                  ) : null}
                  {asset.proxyGeoTiffUrl ? (
                    <img
                      className="solar-asset-preview"
                      src={asset.proxyGeoTiffUrl}
                      alt={`${asset.layer} preview`}
                      loading="lazy"
                    />
                  ) : null}
                </article>
              ))}
            </div>
          </div>

          <div className="card solar-debug-card">
            <h2>Full report (copy/paste friendly)</h2>
            <p className="solar-debug-muted">No collapsible sections. This is plain text JSON for full-page copy/paste.</p>
            <textarea className="solar-debug-report" value={fullReport} readOnly />
          </div>

          <div className="card solar-debug-card">
            <h2>Building insights response JSON</h2>
            <pre className="solar-debug-json-block">{JSON.stringify(result.responses.buildingInsights.payload, null, 2)}</pre>
          </div>

          <div className="card solar-debug-card">
            <h2>Data layers response JSON</h2>
            <pre className="solar-debug-json-block">{JSON.stringify(result.responses.dataLayers.payload, null, 2)}</pre>
          </div>
        </>
      ) : null}
    </div>
  );
}
