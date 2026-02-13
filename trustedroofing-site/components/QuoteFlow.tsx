"use client";

import { useMemo, useState } from "react";
import { quoteScopes, type QuoteScope } from "@/lib/quote";

type ResolvedAddress = {
  fullAddress: string;
  city: string;
  province: string;
  postal: string;
  lat: number;
  lng: number;
};

const quoteHeadlineByScope: Record<QuoteScope, string> = {
  roofing: "Roof",
  all: "Everything",
  vinyl_siding: "Vinyl siding",
  hardie_siding: "Hardie siding",
  eavestrough: "Eavestrough"
};

async function resolveAddress(address: string): Promise<ResolvedAddress | null> {
  try {
    const query = new URLSearchParams({
      q: address,
      format: "jsonv2",
      limit: "1",
      addressdetails: "1"
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${query.toString()}`,
      { headers: { Accept: "application/json" } }
    );

    if (!response.ok) return null;

    const [top] = (await response.json()) as Array<{
      display_name?: string;
      lat?: string;
      lon?: string;
      address?: {
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        postcode?: string;
      };
    }>;

    if (!top?.lat || !top?.lon || !top?.display_name) return null;

    return {
      fullAddress: top.display_name,
      city: top.address?.city ?? top.address?.town ?? top.address?.village ?? "Calgary",
      province: top.address?.state ?? "AB",
      postal: top.address?.postcode ?? "",
      lat: Number(top.lat),
      lng: Number(top.lon)
    };
  } catch {
    return null;
  }
}

export default function QuoteFlow() {
  const [selectedScope, setSelectedScope] = useState<QuoteScope>("roofing");
  const [address, setAddress] = useState("");
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolutionMessage, setResolutionMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredContact, setPreferredContact] = useState("email");
  const [step2Done, setStep2Done] = useState(false);

  const selectedLabel = useMemo(
    () => quoteScopes.find((scope) => scope.value === selectedScope)?.label,
    [selectedScope]
  );

  const submitStep1 = async () => {
    setError(null);
    setIsSubmitting(true);
    setResolutionMessage(null);

    const resolved = await resolveAddress(address);

    const res = await fetch("/api/quotes/step1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_slug: selectedScope,
        place_id: null,
        address_private: resolved?.fullAddress ?? address,
        lat_private: resolved?.lat ?? null,
        lng_private: resolved?.lng ?? null,
        estimate_low: 0,
        estimate_high: 0
      })
    });

    const data = await res.json();
    setIsSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Unable to start quote.");
      return;
    }

    setQuoteId(data.quote_id);
    setResolutionMessage(
      resolved
        ? `Address matched: ${resolved.fullAddress}`
        : "Address saved. Automatic geocode unavailable; city defaults may apply."
    );
  };

  const submitStep2 = async () => {
    if (!quoteId) return;
    setError(null);
    setIsSubmitting(true);

    const res = await fetch("/api/quotes/step2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quote_id: quoteId,
        name,
        email,
        phone,
        preferred_contact: preferredContact
      })
    });

    const data = await res.json();
    setIsSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Unable to save contact details.");
      return;
    }

    setStep2Done(true);
  };

  return (
    <div className="instant-quote form-grid">
      <h2>Instant {quoteHeadlineByScope[selectedScope]} Quote</h2>
      <p className="instant-quote__subhead">
        Get a quick ballpark in under 60 seconds. No pressure.
      </p>

      <div className="instant-quote__scope-row">
        {quoteScopes.map((scope) => (
          <label
            key={scope.value}
            className={`instant-quote__scope-pill ${
              selectedScope === scope.value ? "is-active" : ""
            }`}
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

      {!quoteId ? (
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            void submitStep1();
          }}
        >
          <div className="instant-quote__input-row">
            <input
              className="input"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="123 Main St SW, Calgary AB"
              aria-label="Exact address"
              required
            />
            <button className="button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Get My Instant Estimate"}
            </button>
          </div>
          <p className="instant-quote__meta">Selected scope: {selectedLabel}</p>
        </form>
      ) : (
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            void submitStep2();
          }}
        >
          <p className="instant-quote__meta">Quote started. Request ID: {quoteId}</p>
          <input
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Full name"
            required
          />
          <input
            className="input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            type="email"
            required
          />
          <input
            className="input"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Phone"
            required
          />
          <select
            className="input"
            value={preferredContact}
            onChange={(event) => setPreferredContact(event.target.value)}
          >
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="text">Text</option>
          </select>
          <button className="button" type="submit" disabled={isSubmitting || step2Done}>
            {step2Done ? "Saved" : isSubmitting ? "Saving..." : "Save my contact details"}
          </button>
        </form>
      )}

      {resolutionMessage ? <p className="instant-quote__resolution-detail">{resolutionMessage}</p> : null}
      {error ? <p style={{ color: "var(--color-primary)", margin: 0 }}>{error}</p> : null}
      {step2Done ? <p className="instant-quote__success">Thanks — we will contact you shortly.</p> : null}
    </div>
  );
}
