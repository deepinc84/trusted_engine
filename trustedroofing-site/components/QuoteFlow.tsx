"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { quoteScopes, type QuoteScope } from "@/lib/quote";
import { buildPublicQuoteDisplay, buildQuoteStructuredData } from "@/lib/publicQuoteDisplay";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

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
  dataSourceLabel?: string;
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
  const searchParams = useSearchParams();
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
  const lastSuggestQueryRef = useRef<string>("");


  useEffect(() => {
    if (selectedScope === "hardie_siding") setSidingMaterial("hardie");
    else if (selectedScope === "vinyl_siding") setSidingMaterial("vinyl");
  }, [selectedScope]);

  useEffect(() => {
    const resumeToken = searchParams.get("resume");
    if (!resumeToken || estimate) return;
    const controller = new AbortController();

    const run = async () => {
      try {
        const res = await fetch(`/api/instaquote/resume?token=${encodeURIComponent(resumeToken)}`, {
          signal: controller.signal,
          cache: "no-store"
        });
        const payload = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          requestedScope?: QuoteScope;
          sidingMaterial?: SidingMaterial | null;
          estimate?: EstimateResult;
        };

        if (!res.ok || !payload.ok || !payload.estimate) return;
        setEstimate(payload.estimate);
        setStep(2);
        if (payload.requestedScope) setSelectedScope(payload.requestedScope);
        if (payload.sidingMaterial) setSidingMaterial(payload.sidingMaterial);
        setAddress(payload.estimate.address ?? "");
        setPlaceId(payload.estimate.placeId ?? null);
        setLat(payload.estimate.lat ?? null);
        setLng(payload.estimate.lng ?? null);
        setStatus("Estimate restored. Continue to request your full proposal when ready.");
      } catch {
        // keep standard flow if restore fails
      }
    };

    void run();
    return () => controller.abort();
  }, [searchParams, estimate]);

  useEffect(() => {
    const queryValue = address.trim();
    if (queryValue.length < 4 || step !== 1) {
      setAddressSuggestions([]);
      setSuggestionsOpen(false);
      lastSuggestQueryRef.current = "";
      return;
    }

    if (queryValue === lastSuggestQueryRef.current) {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      const query = new URLSearchParams({ q: queryValue });
      fetch(`/api/geocode/suggest?${query.toString()}`, { signal: controller.signal })
        .then(async (res) => {
          if (!res.ok) return { suggestions: [] as string[] };
          return (await res.json()) as { suggestions?: string[] };
        })
        .then((data) => {
          if (controller.signal.aborted) return;
          const next = data.suggestions ?? [];
          setAddressSuggestions(next);
          setSuggestionsOpen(next.length > 0);
          lastSuggestQueryRef.current = queryValue;
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setAddressSuggestions([]);
          setSuggestionsOpen(false);
        });
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [address, step]);

  const estimateCoords = useMemo(
    () => (estimate && estimate.lat !== null && estimate.lng !== null
      ? { lat: estimate.lat, lng: estimate.lng }
      : null),
    [estimate?.lat, estimate?.lng]
  );
  const nearbyAddress = useMemo(() => {
    if (step !== 2 || !estimate) return null;
    return estimate.address?.trim() || null;
  }, [step, estimate]);

  const selectedSidingRange = estimate
    ? (sidingMaterial === "hardie" ? estimate.extras.sidingHardie : estimate.extras.sidingVinyl)
    : null;
  const alternateSidingRange = estimate
    ? (sidingMaterial === "hardie" ? estimate.extras.sidingVinyl : estimate.extras.sidingHardie)
    : null;
  const explicitScopeSecondary = estimate
    ? (selectedScope === "vinyl_siding"
      ? { label: "Hardie", range: estimate.extras.sidingHardie }
      : selectedScope === "hardie_siding"
        ? { label: "Vinyl", range: estimate.extras.sidingVinyl }
        : null)
    : null;
  const secondarySiding = explicitScopeSecondary ?? {
    label: sidingMaterial === "hardie" ? "Vinyl" : "Hardie",
    range: alternateSidingRange
  };

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
  const publicQuoteDisplay = useMemo(() => {
    if (!estimate) return null;
    return buildPublicQuoteDisplay({
      selectedScope,
      roofAreaSqft: estimate.roofAreaSqft,
      roofSquares: estimate.roofSquares,
      pitchRatio: estimate.pitchRatio,
      pitchDegrees: estimate.pitchDegrees,
      complexityBand: estimate.complexityBand,
      dataSource: estimate.dataSource,
      dataSourceLabel: estimate.dataSourceLabel,
      eavesLengthLf: estimate.extras.eavesLf,
      stories: estimate.extras.assumedStories,
      material: selectedScope === "hardie_siding"
        ? "Hardie board"
        : selectedScope === "vinyl_siding"
          ? "Vinyl siding"
          : undefined
    });
  }, [estimate, selectedScope, sidingMaterial]);
  const quoteStructuredData = useMemo(() => {
    if (!estimate || !primaryRange || !publicQuoteDisplay) return null;
    if (typeof window === "undefined") return null;
    const scopeLabel = quoteScopes.find((scope) => scope.value === selectedScope)?.label ?? "Service";
    return buildQuoteStructuredData({
      pageUrl: window.location.href,
      serviceName: `${scopeLabel} instant estimate`,
      pageName: "Trusted instant estimate result",
      pageDescription: "Service-aware instant estimate details and supporting property attributes.",
      providerName: "Trusted Roofing & Exteriors",
      areaServed: "Calgary, Alberta",
      estimateLow: primaryRange.low,
      estimateHigh: primaryRange.high,
      publicDisplay: publicQuoteDisplay
    });
  }, [estimate, primaryRange, publicQuoteDisplay, selectedScope]);

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
          ? `Estimate ready using trusted regional intelligence fallback. Model debug: ${result.solarDebug ?? "no debug message"} (trace: ${result.solarRequestId ?? "n/a"})`
          : "Estimate ready with trusted internal roof modeling. Complete your details to lock in next steps."
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

  const downloadEstimatePdf = async () => {
    if (!estimate || !primaryRange) return;
    try {
      const res = await fetch("/api/instaquote/quote-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestedScope: selectedScope,
          sidingMaterial,
          primaryLow: primaryRange.low,
          primaryHigh: primaryRange.high,
          estimate
        })
      });
      if (!res.ok) {
        setError("Unable to generate PDF right now.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `instant-estimate-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Unable to generate PDF right now.");
    }
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
          {quoteStructuredData ? (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(quoteStructuredData) }}
            />
          ) : null}
          <div className="instant-quote__estimate-panel">
            <p className="instant-quote__address">{estimate.address}</p>
            <div className="instant-quote__range-hero">
              <p className="instant-quote__range-label">Estimated range</p>
              <h3>
                ${primaryRange?.low.toLocaleString()} - ${primaryRange?.high.toLocaleString()}
              </h3>
              <p>Precise options available after we confirm complexity and access.</p>
              <p>
                Secondary siding ({secondarySiding.label}) range: ${secondarySiding.range?.low.toLocaleString()} - ${secondarySiding.range?.high.toLocaleString()}
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
              {publicQuoteDisplay?.supportingItems.map((item) => (
                <div key={item.key}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="instant-quote__step-actions">
            <button className="button" type="button" onClick={restartFromStep2}>Estimate another address</button>
            <button className="button" type="button" onClick={() => void downloadEstimatePdf()}>Download estimate PDF</button>
            <button className="button button--ghost" type="button" onClick={restartFromStep2}>Cancel step 2</button>
          </div>

          <form
            className="form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              void submitStep2();
            }}
          >
            <div style={{ display: "grid", gap: 6 }}>
              <h3 style={{ margin: 0 }}>Want a full, itemized proposal?</h3>
              <p style={{ margin: 0, color: "var(--color-muted)" }}>
                We&apos;ll review measurements, confirm scope options, and send a detailed proposal within 2 business days.
              </p>
            </div>
            <label>
              Your name
              <input className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" required />
            </label>
            <label>
              Email address
              <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
            </label>
            <label>
              Phone (optional if you prefer email only)
              <input className="input" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="(403) 555-0100" />
            </label>
            <fieldset style={{ border: "1px solid rgba(30,58,138,0.16)", borderRadius: 12, padding: 12, display: "grid", gap: 8 }}>
              <legend style={{ padding: "0 6px", fontWeight: 600 }}>Where are you in the process?</legend>
              <label style={{ border: budgetResponse === "yes" ? "1px solid var(--color-primary)" : "1px solid rgba(148,163,184,0.4)", borderRadius: 10, padding: "8px 10px", cursor: "pointer" }}>
                <input type="radio" name="budget_response" value="yes" checked={budgetResponse === "yes"} onChange={() => setBudgetResponse("yes")} />
                <span style={{ marginLeft: 8, fontWeight: 600 }}>Ready to move forward</span>
                <p style={{ margin: "4px 0 0 24px", color: "var(--color-muted)", fontSize: 13 }}>I&apos;d like a full proposal and next-step scheduling.</p>
              </label>
              <label style={{ border: budgetResponse === "too_expensive" ? "1px solid var(--color-primary)" : "1px solid rgba(148,163,184,0.4)", borderRadius: 10, padding: "8px 10px", cursor: "pointer" }}>
                <input type="radio" name="budget_response" value="too_expensive" checked={budgetResponse === "too_expensive"} onChange={() => setBudgetResponse("too_expensive")} />
                <span style={{ marginLeft: 8, fontWeight: 600 }}>Comparing a few quotes</span>
                <p style={{ margin: "4px 0 0 24px", color: "var(--color-muted)", fontSize: 13 }}>I&apos;m shopping around before I decide.</p>
              </label>
              <label style={{ border: budgetResponse === "financing" ? "1px solid var(--color-primary)" : "1px solid rgba(148,163,184,0.4)", borderRadius: 10, padding: "8px 10px", cursor: "pointer" }}>
                <input type="radio" name="budget_response" value="financing" checked={budgetResponse === "financing"} onChange={() => setBudgetResponse("financing")} />
                <span style={{ marginLeft: 8, fontWeight: 600 }}>Planning ahead</span>
                <p style={{ margin: "4px 0 0 24px", color: "var(--color-muted)", fontSize: 13 }}>Not in a rush — I want accurate options and payment flexibility.</p>
              </label>
            </fieldset>
            <input className="input" value={timeline} onChange={(event) => setTimeline(event.target.value)} placeholder="Timeline (optional)" />
            <button className="button button--ghost" type="button" onClick={() => void downloadEstimatePdf()}>
              Download estimate PDF
            </button>
            <button className="button" type="submit" disabled={submitting || !name || !email}>
              {submitting ? "Submitting..." : "Send me my detailed proposal"}
            </button>
            <p style={{ margin: 0, fontSize: 13, color: "var(--color-muted)" }}>• No obligation &nbsp; • No spam &nbsp; • Response within 2 business days</p>
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

      {/* Keep nearby cards visible on first render (recent 6 quote signals). */}
      <NearbyQuotesCarousel coords={estimateCoords} address={nearbyAddress} />
    </div>
  );
}
