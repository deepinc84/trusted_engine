"use client";

import { useEffect, useState } from "react";

type LocationPayload = {
  label: string;
  source: "edge" | "ip";
  precision: "neighborhood" | "quadrant" | "city" | "region";
};

type LocationState = {
  location: LocationPayload | null;
  loading: boolean;
  error: string | null;
};

const STORAGE_KEY = "trusted-location-probe-v2";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function readCachedLocation(): LocationPayload | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt?: number; location?: LocationPayload };
    if (!parsed.savedAt || !parsed.location) return null;
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) return null;
    return parsed.location;
  } catch {
    return null;
  }
}

export default function HeaderLocationProbe() {
  const [state, setState] = useState<LocationState>({
    location: readCachedLocation(),
    loading: !readCachedLocation(),
    error: null
  });

  useEffect(() => {
    const cached = readCachedLocation();
    if (cached) {
      setState({ location: cached, loading: false, error: null });
      return;
    }

    let active = true;

    const resolveLocation = async () => {
      try {
        const response = await fetch("/api/location/resolve", { method: "GET" });
        const payload = (await response.json().catch(() => ({}))) as {
          location?: LocationPayload;
          error?: string;
        };

        if (!active) return;
        if (!response.ok || !payload.location) {
          setState({ location: null, loading: false, error: payload.error ?? "Unable to resolve location." });
          return;
        }

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
          savedAt: Date.now(),
          location: payload.location
        }));
        setState({ location: payload.location, loading: false, error: null });
      } catch {
        if (!active) return;
        setState({ location: null, loading: false, error: "Unable to resolve location." });
      }
    };

    void resolveLocation();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="site-header__location-test">
      <strong>Approximate area:</strong>{" "}
      {state.loading ? "Detecting…" : state.location?.label ?? state.error ?? "Unavailable"}
      {" · "}
      <span>
        source: {state.location?.source === "edge" ? "hosting geo headers" : state.location?.source ?? "n/a"}
        {" / "}
        precision: {state.location?.precision ?? "n/a"}
        {" / no browser GPS used"}
      </span>
    </div>
  );
}
