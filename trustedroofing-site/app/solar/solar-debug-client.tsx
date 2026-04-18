"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

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
    available: boolean;
    reason: string;
  }>;
  fieldGuide: Record<string, Record<string, string>>;
  error?: string;
};

type AutocompleteSuggestion = {
  label: string;
  place_id?: string | null;
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

async function parseResponsePayload(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { error: `Unexpected non-JSON response: ${text.slice(0, 300)}` };
  }
}

export default function SolarDebugClient() {
  const [address, setAddress] = useState("1600 Amphitheatre Parkway, Mountain View, CA");
  const [radiusMeters, setRadiusMeters] = useState(100);
  const [pixelSizeMeters, setPixelSizeMeters] = useState(0.5);
  const [status, setStatus] = useState("Ready.");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SolarInspectResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [autocompleteBusy, setAutocompleteBusy] = useState(false);
  const [addressValidated, setAddressValidated] = useState(false);

  const endpointRows = useMemo(() => result?.endpointReferences ?? [], [result]);
  const autocompleteAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const query = address.trim();
    setAddressValidated(false);

    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setAutocompleteBusy(true);

    const timer = window.setTimeout(async () => {
      try {
        autocompleteAbortRef.current?.abort();
        const controller = new AbortController();
        autocompleteAbortRef.current = controller;

        const response = await fetch(`/api/geocode/autocomplete?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
          cache: "no-store"
        });

        const payload = (await parseResponsePayload(response)) as {
          suggestions?: AutocompleteSuggestion[];
        };

        if (!response.ok) {
          throw new Error(`Autocomplete failed (${response.status} ${response.statusText}).`);
        }

        setSuggestions(Array.isArray(payload.suggestions) ? payload.suggestions : []);
      } catch (suggestionError) {
        if (suggestionError instanceof DOMException && suggestionError.name === "AbortError") return;
        setSuggestions([]);
      } finally {
        setAutocompleteBusy(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [address]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("Calling geocode + Solar endpoints...");
    setError(null);

    const cleanAddress = address.trim();
    if (cleanAddress.length < 6) {
      setError("Please enter a full address before running inspection.");
      setStatus("Validation failed.");
      setLoading(false);
      return;
    }

    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 45000);

      const response = await fetch("/api/solar/inspect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          address: cleanAddress,
          radiusMeters: Number.isFinite(radiusMeters) ? radiusMeters : 100,
          pixelSizeMeters: Number.isFinite(pixelSizeMeters) ? pixelSizeMeters : 0.5
        }),
        signal: controller.signal
      });

      window.clearTimeout(timeout);

      const payload = (await parseResponsePayload(response)) as SolarInspectResponse;

      if (!response.ok || payload.error) {
        const detail =
          payload.error ?? `Solar inspector request failed (${response.status} ${response.statusText || "unknown"}).`;
        throw new Error(detail);
      }

      setResult(payload);
      setStatus("Done. Data loaded.");
    } catch (requestError) {
      const message =
        requestError instanceof DOMException && requestError.name === "AbortError"
          ? "Request timed out after 45 seconds. Please try again."
          : requestError instanceof Error
            ? requestError.message
            : "Unexpected request error.";
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
            autoComplete="off"
          />
        </label>

        {autocompleteBusy ? <p className="solar-debug-muted">Checking valid addresses…</p> : null}
        {suggestions.length > 0 ? (
          <div className="solar-suggestions">
            {suggestions.map((suggestion) => (
              <button
                key={`${suggestion.label}-${suggestion.place_id ?? "none"}`}
                type="button"
                className="solar-suggestion-btn"
                onClick={() => {
                  setAddress(suggestion.label);
                  setSuggestions([]);
                  setAddressValidated(true);
                  setStatus("Address selected from autocomplete.");
                }}
              >
                {suggestion.label}
              </button>
            ))}
          </div>
        ) : null}

        {addressValidated ? <p className="admin-status admin-status--success">Address selected from autocomplete.</p> : null}

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
              Each row shows whether an asset was returned. Missing rows include a reason so you can
              see why a requested layer did not come back.
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
