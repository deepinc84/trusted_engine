"use client";

import { useEffect, useMemo, useState } from "react";
import { quoteScopes, type QuoteScope } from "@/lib/quote";
import dynamic from "next/dynamic";

const NearbyQuotesCarousel = dynamic(() => import("@/components/NearbyQuotesCarousel"), {
  ssr: false,
  loading: () => <p className="instant-quote__meta">Loading nearby quote activity…</p>
});

type BudgetResponse = "yes" | "financing" | "too_expensive";
type SidingMaterial = "vinyl" | "hardie";

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
  solarRequestId?: string;
  extras: {
    assumedStories: 2;
    eavesLf: number;
    eaves: { low: number; high: number };
    sidingSqft: number;
    sidingVinyl: { low: number; high: number };
    sidingHardie: { low: number; high: number };
  };
  ranges: {
    good: { low: number; high: number };
    better: { low: number; high: number };
    best: { low: number; high: number };
    eaves: { low: number; high: number };
    siding: { low: number; high: number };
  };
};

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
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const [estimate, setEstimate] = useState<EstimateResult | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [budgetResponse, setBudgetResponse] = useState<BudgetResponse>("yes");
  const [timeline, setTimeline] = useState("");
  const [sidingMaterial, setSidingMaterial] = useState<SidingMaterial>("vinyl");

  const selectedLabel = useMemo(
    () => quoteScopes.find((scope) => scope.value === selectedScope)?.label,
    [selectedScope]
  );


  useEffect(() => {
    if (selectedScope === "hardie_siding") setSidingMaterial("hardie");
    else if (selectedScope === "vinyl_siding") setSidingMaterial("vinyl");
  }, [selectedScope]);

  useEffect(() => {
    if (address.trim().length < 2 || step !== 1) {
      setAddressSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      const query = new URLSearchParams({ q: address.trim() });
      fetch(`/api/geocode/suggest?${query.toString()}`)
        .then(async (res) => {
          if (!res.ok) return { suggestions: [] as string[] };
          return (await res.json()) as { suggestions?: string[] };
        })
        .then((data) => {
          const next = data.suggestions ?? [];
          setAddressSuggestions(next);
          setSuggestionsOpen(next.length > 0);
        })
        .catch(() => {
          setAddressSuggestions([]);
          setSuggestionsOpen(false);
        });
    }, 220);

    return () => clearTimeout(timer);
  }, [address, step]);

  const estimateCoords = estimate && estimate.lat !== null && estimate.lng !== null
    ? { lat: estimate.lat, lng: estimate.lng }
    : null;

  const selectedSidingRange = estimate
    ? (sidingMaterial === "hardie" ? estimate.extras.sidingHardie : estimate.extras.sidingVinyl)
    : null;

  const combinedAllRange = estimate && selectedSidingRange
    ? {
      low: estimate.ranges.good.low + estimate.extras.eaves.low + selectedSidingRange.low,
      high: estimate.ranges.good.high + estimate.extras.eaves.high + selectedSidingRange.high
    }
    : null;

  const primaryRange = estimate
    ? (selectedScope === "vinyl_siding"
      ? estimate.extras.sidingVinyl
      : selectedScope === "hardie_siding"
        ? estimate.extras.sidingHardie
        : selectedScope === "eavestrough"
          ? estimate.extras.eaves
          : selectedScope === "all"
            ? combinedAllRange ?? estimate.ranges.good
            : estimate.ranges.good)
    : null;

  const submitStep1 = async () => {
    setSubmitting(true);
    setError(null);
    setStatus(null);
    setSuggestionsOpen(false);

    try {
      const res = await fetch("/api/instaquote/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, placeId, lat, lng, serviceScope: selectedScope })
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
          ? `Estimate ready using regional fallback. Solar debug: ${result.solarDebug ?? "no debug message"} (trace: ${result.solarRequestId ?? "n/a"})`
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
          sidingLow: selectedSidingRange?.low ?? estimate.extras.sidingVinyl.low,
          sidingHigh: selectedSidingRange?.high ?? estimate.extras.sidingVinyl.high,
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
    setSuggestionsOpen(false);
    setPlaceId(null);
    setLat(null);
    setLng(null);
    setName("");
    setEmail("");
    setPhone("");
    setBudgetResponse("yes");
    setTimeline("");
    setSidingMaterial("vinyl");
    setStatus(null);
    setError(null);
  };

  const resetAll = () => {
    setStep(1);
    setEstimate(null);
    setAddress("");
    setAddressSuggestions([]);
    setSuggestionsOpen(false);
    setPlaceId(null);
    setLat(null);
    setLng(null);
    setName("");
    setEmail("");
    setPhone("");
    setBudgetResponse("yes");
    setTimeline("");
    setSidingMaterial("vinyl");
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
            <div className="instant-quote__address-wrap">
              <input
                  className="input"
                value={address}
                onChange={(event) => {
                  setAddress(event.target.value);
                  setPlaceId(null);
                  setLat(null);
                  setLng(null);
                }}
                onFocus={() => setSuggestionsOpen(addressSuggestions.length > 0)}
                onBlur={() => {
                  window.setTimeout(() => setSuggestionsOpen(false), 120);
                }}
                placeholder="123 Main St SW, Calgary AB"
                aria-label="Exact address"
                autoComplete="off"
                required
              />
              {suggestionsOpen && addressSuggestions.length > 0 ? (
                <ul className="instant-quote__suggestions" role="listbox" aria-label="Address suggestions">
                  {addressSuggestions.map((option) => (
                    <li key={option}>
                      <button
                        type="button"
                        className="instant-quote__suggestion-btn"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setAddress(option);
                          setSuggestionsOpen(false);
                        }}
                      >
                        {option}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
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
                ${primaryRange?.low.toLocaleString()} - ${primaryRange?.high.toLocaleString()}
              </h3>
              <p>Precise options available after we confirm complexity and access.</p>
              <p>
                Secondary siding ({sidingMaterial === "hardie" ? "Hardie" : "Vinyl"}) range: ${selectedSidingRange?.low.toLocaleString()} - ${selectedSidingRange?.high.toLocaleString()}
              </p>
            </div>
            {selectedScope === "roofing" || selectedScope === "eavestrough" ? null : (
              <div className="instant-quote__scope-row">
                <label className={`instant-quote__scope-pill ${sidingMaterial === "vinyl" ? "is-active" : ""}`}>
                <input
                  type="radio"
                  name="siding_material"
                  value="vinyl"
                  checked={sidingMaterial === "vinyl"}
                  onChange={() => setSidingMaterial("vinyl")}
                />
                <span>Vinyl siding</span>
              </label>
                <label className={`instant-quote__scope-pill ${sidingMaterial === "hardie" ? "is-active" : ""}`}>
                  <input
                    type="radio"
                    name="siding_material"
                    value="hardie"
                    checked={sidingMaterial === "hardie"}
                    onChange={() => setSidingMaterial("hardie")}
                  />
                  <span>Hardie siding</span>
                </label>
              </div>
            )}
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

      {step >= 2 ? <NearbyQuotesCarousel coords={estimateCoords} address={estimate?.address ?? address} /> : null}
    </div>
  );
}
