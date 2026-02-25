"use client";

import { useMemo, useState } from "react";

type EstimateResult = {
  address: string;
  addressQueryId: string; // quote_events.id
  roofAreaSqft: number;
  roofSquares: number;
  pitchDegrees: number;
  complexityBand: string;
  dataSource: string;
  areaSource: string;
  lat: number | null;
  lng: number | null;
  ranges: {
    good: { low: number; high: number };
    better: { low: number; high: number };
    best: { low: number; high: number };
    eaves: { low: number; high: number };
    siding: { low: number; high: number };
  };
};

type NearbyItem = {
  lat: number;
  lng: number;
  address: string | null;
  city: string | null;
  province: string | null;
  estimate_low: number | null;
  estimate_high: number | null;
  service_type: string | null;
  roof_area_sqft: number | null;
  complexity_band: string | null;
  created_at: string;
};

function timeAgo(iso: string) {
  const t = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - t);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}

export default function InstaquotePage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [address, setAddress] = useState("");
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [nearby, setNearby] = useState<NearbyItem[]>([]);
  const [nearbyStatus, setNearbyStatus] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [budgetResponse, setBudgetResponse] = useState<"yes" | "financing" | "too_expensive">("yes");
  const [timeline, setTimeline] = useState("");

  const quoteBanner = useMemo(() => {
    if (!estimate) return null;
    return `$${estimate.ranges.good.low.toLocaleString()} – $${estimate.ranges.good.high.toLocaleString()}`;
  }, [estimate]);

  const loadNearby = async (lat: number, lng: number) => {
    setNearbyStatus(null);
    try {
      const res = await fetch(
        `/api/instaquote/nearby?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&radiusKm=25`,
        { method: "GET" }
      );
      const payload = (await res.json()) as { ok?: boolean; items?: NearbyItem[]; error?: string };
      if (!res.ok || !payload.ok) {
        setNearbyStatus(payload.error ?? "Unable to load nearby quotes.");
        return;
      }
      setNearby(payload.items ?? []);
    } catch {
      setNearbyStatus("Unable to load nearby quotes right now.");
    }
  };

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

      const next = payload as EstimateResult;
      setEstimate(next);
      setAddress(next.address ?? address);
      setStep(2);
      setSubmitting(false);

      if (next.lat !== null && next.lng !== null) {
        void loadNearby(next.lat, next.lng);
      }
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
          lat: estimate.lat,
          lng: estimate.lng,
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

  const resetAll = () => {
    setStep(1);
    setEstimate(null);
    setStatus(null);
    setSubmitting(false);
    setAddress("");
    setName("");
    setEmail("");
    setPhone("");
    setBudgetResponse("yes");
    setTimeline("");
  };

  return (
    <section className="section" style={{ maxWidth: 960, margin: "0 auto" }}>
      <div className="card" style={{ display: "grid", gap: 16 }}>
        <h1 style={{ margin: 0, color: "#C9362E" }}>Instant Quote</h1>
        <p style={{ margin: 0 }}>
          Enter your address, get a real estimate, see what other homeowners nearby are being quoted.
        </p>

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

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span className="chip">≈60s</span>
              <span className="chip">No cost</span>
              <span className="chip">±5%</span>
            </div>

            <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>
              Note, detached garages, additions, and multi-structure properties can change the final scope.
            </p>

            <button className="button" onClick={() => void requestEstimate()} disabled={submitting || !address.trim()}>
              {submitting ? "Calculating..." : "Get My Instant Estimate"}
            </button>
          </>
        ) : null}

        {step >= 2 && estimate ? (
          <>
            <div
              className="card"
              style={{
                background: "#C9362E",
                color: "white",
                borderColor: "#C9362E",
                textAlign: "center"
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 22 }}>{quoteBanner}</div>
              <div style={{ opacity: 0.95, marginTop: 4, fontSize: 13 }}>Instant estimate range</div>
            </div>

            <div className="card" style={{ background: "#fff7f6", borderColor: "#f2cbc7" }}>
              <p style={{ margin: "0 0 8px", fontWeight: 700 }}>{estimate.address}</p>
              <p style={{ margin: 0 }}>
                Roof area: {estimate.roofAreaSqft} sqft, {estimate.roofSquares} squares
              </p>
              <p style={{ margin: 0 }}>
                Pitch: {estimate.pitchDegrees}°, Complexity: {estimate.complexityBand}
              </p>
              <p style={{ margin: 0 }}>
                Source: {estimate.dataSource}, {estimate.areaSource}
              </p>
            </div>

            {step === 2 ? (
              <div style={{ display: "grid", gap: 10 }}>
                <label>
                  Full Name
                  <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <label>
                  Phone
                  <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </label>
                <label>
                  Email
                  <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>

                <label>
                  Are you comfortable with this range?
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
                    <button
                      type="button"
                      className={budgetResponse === "yes" ? "button" : "button secondary"}
                      onClick={() => {     if (estimate?.lat == null || estimate?.lng == null) return     void loadNearby(lat, lng)   }} 
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      className={budgetResponse === "financing" ? "button" : "button secondary"}
                      onClick={() => setBudgetResponse("financing")}
                    >
                      Financing
                    </button>
                    <button
                      type="button"
                      className={budgetResponse === "too_expensive" ? "button" : "button secondary"}
                      onClick={() => setBudgetResponse("too_expensive")}
                    >
                      Too expensive
                    </button>
                  </div>
                </label>

                <label>
                  Timeline
                  <select className="input" value={timeline} onChange={(e) => setTimeline(e.target.value)}>
                    <option value="">Select…</option>
                    <option value="ASAP">ASAP</option>
                    <option value="1-3 months">1 to 3 months</option>
                    <option value="3-6 months">3 to 6 months</option>
                    <option value="6+ months">6 plus months</option>
                  </select>
                </label>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button className="button" onClick={() => void submitLead()} disabled={submitting || !name || !email || !phone}>
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                  <button className="button secondary" type="button" onClick={resetAll} disabled={submitting}>
                    Start over
                  </button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        {step === 3 ? (
          <div className="card" style={{ borderColor: "#b7e2c2", background: "#f2fff6" }}>
            <div style={{ fontWeight: 800, color: "#1e7f3f" }}>Thanks, you’re in.</div>
            <ol style={{ marginTop: 10, marginBottom: 0, paddingLeft: 20 }}>
              <li>We review your roof data and confirm the scope.</li>
              <li>We contact you to book a quick on-site verification.</li>
              <li>You get a firm written quote and schedule options.</li>
            </ol>

            <div style={{ marginTop: 12 }}>
              <button className="button" type="button" onClick={resetAll}>
                Price another property
              </button>
            </div>
          </div>
        ) : null}

        {status ? <p style={{ margin: 0, color: "#C9362E" }}>{status}</p> : null}
      </div>

      <div className="card" style={{ marginTop: 18, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, color: "#C9362E" }}>Recently Quoted Projects Near You</h2>
          {estimate?.lat !== null && estimate?.lng !== null ? (
            <button className="button secondary" type="button" onClick={() => void loadNearby(estimate.lat!, estimate.lng!)}>
              Refresh
            </button>
          ) : null}
        </div>

        {nearbyStatus ? <p style={{ margin: 0, color: "#C9362E" }}>{nearbyStatus}</p> : null}

        {nearby.length === 0 ? (
          <p style={{ margin: 0, opacity: 0.75 }}>Quote an address to see recent activity in your area.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {nearby.map((item, idx) => {
              const label = item.city ? `${item.city}${item.province ? `, ${item.province}` : ""}` : "Nearby";
              const price =
                item.estimate_low !== null && item.estimate_high !== null
                  ? `$${Number(item.estimate_low).toLocaleString()} – $${Number(item.estimate_high).toLocaleString()}`
                  : "Estimate";

              const meta: string[] = [];
              if (item.roof_area_sqft) meta.push(`${item.roof_area_sqft} sqft`);
              if (item.complexity_band) meta.push(item.complexity_band);
              if (item.service_type) meta.push(item.service_type);

              return (
                <div key={`${item.created_at}-${idx}`} className="card" style={{ display: "grid", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 800 }}>{label}</div>
                    <div style={{ opacity: 0.8, fontSize: 13 }}>{timeAgo(item.created_at)}</div>
                  </div>
                  <div style={{ fontWeight: 800, color: "#C9362E" }}>{price}</div>
                  {meta.length ? <div style={{ opacity: 0.8, fontSize: 13 }}>{meta.join(" · ")}</div> : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
