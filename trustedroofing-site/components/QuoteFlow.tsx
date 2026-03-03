"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import NearbyQuotesCarousel from "@/components/NearbyQuotesCarousel";
import { quoteScopes, type QuoteScope } from "@/lib/quote";

type BudgetResponse = "yes" | "financing" | "too_expensive";

type EstimateResult = {
  ok: true;
  addressQueryId: string;
  address: string;
  placeId: string | null;
  lat: number | null;
  lng: number | null;
  roofAreaSqft: number;
  roofSquares: number;
  pitchDegrees: number;
  pitchRatio?: string;
  dataSource: string;
  areaSource: string;
  complexityBand: string;
  complexityScore: number;
  solarDebug?: string | null;
  ranges: {
    good: { low: number; high: number };
    better: { low: number; high: number };
    best: { low: number; high: number };
    eaves: { low: number; high: number };
    siding: { low: number; high: number };
  };
};

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: new (
            input: HTMLInputElement,
            opts?: Record<string, unknown>
          ) => {
            addListener: (eventName: string, callback: () => void) => void;
            getPlace: () => {
              place_id?: string;
              formatted_address?: string;
              geometry?: { location?: { lat: () => number; lng: () => number } };
            };
          };
        };
      };
    };
  }
}

const quoteHeadlineByScope: Record<QuoteScope, string> = {
  roofing: "Roof",
  all: "Everything",
  vinyl_siding: "Vinyl siding",
  hardie_siding: "Hardie siding",
  eavestrough: "Eavestrough"
};

function parseJsonSafe(text: string) {
  try {
    return text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export default function QuoteFlow() {
  const [selectedScope, setSelectedScope] = useState<QuoteScope>("roofing");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [address, setAddress] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const [estimate, setEstimate] = useState<EstimateResult | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [budgetResponse, setBudgetResponse] = useState<BudgetResponse>("yes");
  const [timeline, setTimeline] = useState("");

  const selectedLabel = useMemo(
    () => quoteScopes.find((scope) => scope.value === selectedScope)?.label,
    [selectedScope]
  );

  const addressInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (address.trim().length < 3 || step !== 1) {
      setAddressSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      const query = new URLSearchParams({ q: address.trim() });
      fetch(`/api/geocode/suggest?${query.toString()}`)
        .then(async (res) => {
          if (!res.ok) return { suggestions: [] as string[] };
          return (await res.json()) as { suggestions?: string[] };
        })
        .then((data) => setAddressSuggestions(data.suggestions ?? []))
        .catch(() => setAddressSuggestions([]));
    }, 250);

    return () => clearTimeout(timer);
  }, [address, step]);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key || !addressInputRef.current) return;

    const setupAutocomplete = () => {
      if (!window.google?.maps?.places || !addressInputRef.current) return;
      const ac = new window.google.maps.places.Autocomplete(addressInputRef.current, {
        fields: ["formatted_address", "place_id", "geometry"],
        componentRestrictions: { country: "ca" }
      });

      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        const formattedAddress = place.formatted_address ?? "";
        setAddress(formattedAddress || addressInputRef.current?.value || "");
        setPlaceId(place.place_id ?? null);
        setLat(place.geometry?.location?.lat?.() ?? null);
        setLng(place.geometry?.location?.lng?.() ?? null);
      });
    };

    if (window.google?.maps?.places) {
      setupAutocomplete();
      return;
    }

    const scriptId = "google-maps-places-script";
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", setupAutocomplete, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`;
    script.onload = setupAutocomplete;
    document.head.appendChild(script);
  }, []);

  const estimateCoords = estimate && estimate.lat !== null && estimate.lng !== null
    ? { lat: estimate.lat, lng: estimate.lng }
    : null;

  const submitStep1 = async () => {
    setSubmitting(true);
    setError(null);
    setStatus(null);

    try {
      const res = await fetch("/api/instaquote/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, placeId, lat, lng })
      });

      const text = await res.text();
      const payload = parseJsonSafe(text);

      if (!res.ok || !payload.ok) {
        setError(String(payload.error ?? "Unable to calculate estimate."));
        setSubmitting(false);
        return;
      }

      const result = payload as unknown as EstimateResult;
      setEstimate(result);
      setAddress(result.address ?? address);
      setPlaceId(result.placeId ?? placeId);
      setLat(result.lat ?? lat);
      setLng(result.lng ?? lng);
      setStep(2);
      setStatus(
        result.areaSource === "regional"
          ? `Estimate ready using regional fallback. Solar debug: ${result.solarDebug ?? "no debug message"}`
          : "Estimate ready with Google Solar data. Complete your details to lock in next steps."
      );
    } catch {
      setError("Unable to calculate estimate right now.");
    }

    setSubmitting(false);
  };

  const submitStep2 = async () => {
    if (!estimate) return;
    setSubmitting(true);
    setError(null);
    setStatus(null);

    try {
      const res = await fetch("/api/instaquote/save-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressQueryId: estimate.addressQueryId,
          address: estimate.address,
          placeId: estimate.placeId,
          lat: estimate.lat,
          lng: estimate.lng,
          name,
          email,
          phone,
          budgetResponse,
          timeline,
          roofAreaSqft: estimate.roofAreaSqft,
          roofSquares: estimate.roofSquares,
          pitch: estimate.pitchRatio ?? `${estimate.pitchDegrees}°`,
          goodLow: estimate.ranges.good.low,
          goodHigh: estimate.ranges.good.high,
          betterLow: estimate.ranges.better.low,
          betterHigh: estimate.ranges.better.high,
          bestLow: estimate.ranges.best.low,
          bestHigh: estimate.ranges.best.high,
          eavesLow: estimate.ranges.eaves.low,
          eavesHigh: estimate.ranges.eaves.high,
          sidingLow: estimate.ranges.siding.low,
          sidingHigh: estimate.ranges.siding.high,
          leadScore: estimate.complexityScore,
          dataSource: estimate.dataSource,
          serviceScope: selectedScope
        })
      });

      const text = await res.text();
      const payload = parseJsonSafe(text);

      if (!res.ok || !payload.ok) {
        setError(String(payload.error ?? "Unable to save lead."));
        setSubmitting(false);
        return;
      }

      setStep(3);
      setStatus("Thanks — your request is in.");
    } catch {
      setError("Unable to submit lead right now.");
    }

    setSubmitting(false);
  };


  const restartFromStep2 = () => {
    setStep(1);
    setEstimate(null);
    setAddress("");
    setAddressSuggestions([]);
    setPlaceId(null);
    setLat(null);
    setLng(null);
    setName("");
    setEmail("");
    setPhone("");
    setBudgetResponse("yes");
    setTimeline("");
    setStatus(null);
    setError(null);
  };

  const resetAll = () => {
    setStep(1);
    setEstimate(null);
    setAddress("");
    setAddressSuggestions([]);
    setPlaceId(null);
    setLat(null);
    setLng(null);
    setName("");
    setEmail("");
    setPhone("");
    setBudgetResponse("yes");
    setTimeline("");
    setStatus(null);
    setError(null);
  };

  return (
    <div className="instant-quote form-grid">
      <h2>Instant {quoteHeadlineByScope[selectedScope]} Quote</h2>
      <p className="instant-quote__subhead">Address first, instant estimate second, follow-up third.</p>

      <div className="instant-quote__scope-row">
        {quoteScopes.map((scope) => (
          <label
            key={scope.value}
            className={`instant-quote__scope-pill ${selectedScope === scope.value ? "is-active" : ""}`}
          >
            <input
              type="radio"
              name="quote_scope"
              value={scope.value}
              checked={selectedScope === scope.value}
              onChange={() => setSelectedScope(scope.value)}
            />
            <span>{scope.label}</span>
          </label>
        ))}
      </div>

      {step === 1 ? (
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            void submitStep1();
          }}
        >
          <div className="instant-quote__input-row">
            <input
              ref={addressInputRef}
              className="input"
              value={address}
              onChange={(event) => {
                setAddress(event.target.value);
                setPlaceId(null);
                setLat(null);
                setLng(null);
              }}
              placeholder="123 Main St SW, Calgary AB"
              aria-label="Exact address"
              list="quote-address-suggestions"
              required
            />
            <datalist id="quote-address-suggestions">
              {addressSuggestions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
            <button className="button" type="submit" disabled={submitting || !address.trim()}>
              {submitting ? "Calculating..." : "Get My Instant Estimate"}
            </button>
          </div>
          <p className="instant-quote__meta">Selected scope: {selectedLabel}</p>
        </form>
      ) : null}

      {step === 2 && estimate ? (
        <>
          <div className="instant-quote__estimate-panel">
            <p className="instant-quote__address">{estimate.address}</p>
            <div className="instant-quote__range-hero">
              <p className="instant-quote__range-label">Estimated range</p>
              <h3>
                ${estimate.ranges.good.low.toLocaleString()} - ${estimate.ranges.good.high.toLocaleString()}
              </h3>
              <p>Precise options available after we confirm complexity and access.</p>
            </div>
            <div className="instant-quote__stats-grid">
              <div>
                <span>Roof size</span>
                <strong>{estimate.roofAreaSqft} sqft ({estimate.roofSquares} squares)</strong>
              </div>
              <div>
                <span>Pitch</span>
                <strong>{estimate.pitchRatio ?? `${estimate.pitchDegrees}°`}</strong>
              </div>
              <div>
                <span>Complexity</span>
                <strong>{estimate.complexityBand}</strong>
              </div>
              <div>
                <span>Data source</span>
                <strong>{estimate.dataSource}</strong>
              </div>
            </div>
          </div>

          <div className="instant-quote__step-actions">
            <button className="button" type="button" onClick={restartFromStep2}>Estimate another address</button>
            <button className="button button--ghost" type="button" onClick={restartFromStep2}>Cancel step 2</button>
          </div>

          <form
            className="form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              void submitStep2();
            }}
          >
            <input className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" required />
            <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" required />
            <input className="input" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone" required />
            <select className="input" value={budgetResponse} onChange={(event) => setBudgetResponse(event.target.value as BudgetResponse)}>
              <option value="yes">Yes, ready to move forward</option>
              <option value="financing">I need monthly payment options</option>
              <option value="too_expensive">Too high, I’m price checking</option>
            </select>
            <input className="input" value={timeline} onChange={(event) => setTimeline(event.target.value)} placeholder="Timeline (optional)" />
            <button className="button" type="submit" disabled={submitting || !name || !email || !phone}>
              {submitting ? "Submitting..." : "Request My Detailed Quote"}
            </button>
          </form>
        </>
      ) : null}

      {step === 3 ? (
        <div className="card">
          <p className="instant-quote__success">Thanks — your request is in.</p>
          <button className="button" type="button" onClick={resetAll}>Start a new quote</button>
        </div>
      ) : null}

      {status ? <p className="instant-quote__meta">{status}</p> : null}
      {error ? <p className="instant-quote__error">{error}</p> : null}

      <NearbyQuotesCarousel coords={estimateCoords} address={estimate?.address ?? address} />
    </div>
  );
}
