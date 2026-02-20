"use client";

import { useState } from "react";

type EstimateResult = {
  address: string;
  addressQueryId: string;
  roofAreaSqft: number;
  roofSquares: number;
  pitchDegrees: number;
  complexityBand: string;
  dataSource: string;
  areaSource: string;
  ranges: {
    good: { low: number; high: number };
    better: { low: number; high: number };
    best: { low: number; high: number };
    eaves: { low: number; high: number };
    siding: { low: number; high: number };
  };
};

export default function InstaquotePage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [address, setAddress] = useState("");
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [budgetResponse, setBudgetResponse] = useState<"yes" | "financing" | "too_expensive">("yes");
  const [timeline, setTimeline] = useState("");

  const requestEstimate = async () => {
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/instaquote/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address })
      });
      const payload = (await res.json()) as { ok?: boolean; error?: string } & Partial<EstimateResult>;
      if (!res.ok || !payload.ok) {
        setStatus(payload.error ?? "Unable to calculate estimate.");
        setSubmitting(false);
        return;
      }

      setEstimate(payload as EstimateResult);
      setAddress(payload.address ?? address);
      setStep(2);
      setSubmitting(false);
    } catch {
      setSubmitting(false);
      setStatus("Unable to calculate estimate right now.");
    }
  };

  const submitLead = async () => {
    if (!estimate) return;

    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/instaquote/save-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressQueryId: estimate.addressQueryId,
          address: estimate.address,
          name,
          email,
          phone,
          budgetResponse,
          timeline,
          roofAreaSqft: estimate.roofAreaSqft,
          roofSquares: estimate.roofSquares,
          pitch: `${estimate.pitchDegrees}°`,
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
          dataSource: estimate.dataSource
        })
      });

      const payload = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !payload.ok) {
        setStatus(payload.error ?? "Unable to save lead.");
        setSubmitting(false);
        return;
      }

      setStep(3);
      setSubmitting(false);
    } catch {
      setSubmitting(false);
      setStatus("Unable to submit lead right now.");
    }
  };

  return (
    <section className="section" style={{ maxWidth: 960, margin: "0 auto" }}>
      <div className="card" style={{ display: "grid", gap: 16 }}>
        <h1 style={{ margin: 0, color: "#C9362E" }}>Instant Quote</h1>
        <p style={{ margin: 0 }}>Fast estimate powered by geospatial roof data and regional fallback.</p>

        {step === 1 ? (
          <>
            <label>
              Property address
              <input
                className="input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St SW, Calgary AB"
              />
            </label>
            <button className="button" onClick={() => void requestEstimate()} disabled={submitting || !address.trim()}>
              {submitting ? "Calculating..." : "Get estimate"}
            </button>
          </>
        ) : null}

        {step >= 2 && estimate ? (
          <>
            <div className="card" style={{ background: "#fff7f6", borderColor: "#f2cbc7" }}>
              <p style={{ margin: "0 0 8px", fontWeight: 700 }}>{estimate.address}</p>
              <p style={{ margin: 0 }}>Roof area: {estimate.roofAreaSqft} sqft ({estimate.roofSquares} squares)</p>
              <p style={{ margin: 0 }}>Pitch: {estimate.pitchDegrees}° · Complexity: {estimate.complexityBand}</p>
              <p style={{ margin: 0 }}>Data source: {estimate.dataSource} ({estimate.areaSource})</p>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <p style={{ margin: 0 }}>Good: ${estimate.ranges.good.low.toLocaleString()} - ${estimate.ranges.good.high.toLocaleString()}</p>
              <p style={{ margin: 0 }}>Better: ${estimate.ranges.better.low.toLocaleString()} - ${estimate.ranges.better.high.toLocaleString()}</p>
              <p style={{ margin: 0 }}>Best: ${estimate.ranges.best.low.toLocaleString()} - ${estimate.ranges.best.high.toLocaleString()}</p>
            </div>

            {step === 2 ? (
              <div style={{ display: "grid", gap: 10 }}>
                <label>
                  Name
                  <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <label>
                  Email
                  <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
                <label>
                  Phone
                  <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </label>
                <label>
                  Budget response
                  <select className="input" value={budgetResponse} onChange={(e) => setBudgetResponse(e.target.value as "yes" | "financing" | "too_expensive")}>
                    <option value="yes">Yes</option>
                    <option value="financing">Financing</option>
                    <option value="too_expensive">Too expensive</option>
                  </select>
                </label>
                <label>
                  Timeline
                  <input className="input" value={timeline} onChange={(e) => setTimeline(e.target.value)} />
                </label>
                <button className="button" onClick={() => void submitLead()} disabled={submitting || !name || !email || !phone}>
                  {submitting ? "Submitting..." : "Submit lead"}
                </button>
              </div>
            ) : null}
          </>
        ) : null}

        {step === 3 ? <p style={{ margin: 0, fontWeight: 700 }}>Thanks — your request is in.</p> : null}
        {status ? <p style={{ margin: 0, color: "#C9362E" }}>{status}</p> : null}
      </div>
    </section>
  );
}
