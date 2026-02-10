"use client";

import { useMemo, useState } from "react";
import {
  defaultServiceTypeFromScope,
  quoteScopes,
  type QuoteScope
} from "@/lib/quote";

type Step1Payload = {
  address: string;
  city: string;
  province: string;
  postal: string;
  lat: number;
  lng: number;
  estimate_low: number;
  estimate_high: number;
  service_type: string;
  requested_scopes: string[];
};

const quoteHeadlineByScope: Record<QuoteScope, string> = {
  roofing: "Roof",
  all: "Everything",
  vinyl_siding: "Vinyl siding",
  hardie_siding: "Hardie siding",
  eavestrough: "Eavestrough"
};

export default function QuoteFlow() {
  const [selectedScope, setSelectedScope] = useState<QuoteScope>("roofing");
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setIsSubmitting(true);

    const payload: Step1Payload = {
      address,
      city: "Calgary",
      province: "AB",
      postal: "",
      lat: 0,
      lng: 0,
      estimate_low: 0,
      estimate_high: 0,
      service_type: defaultServiceTypeFromScope(selectedScope),
      requested_scopes: [selectedScope]
    };

    try {
      const res = await fetch("/api/quotes/step1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unable to submit your address right now.");
        return;
      }
      setQuoteId(data.quote_id);
      setAddress("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedLabel = useMemo(
    () => quoteScopes.find((scope) => scope.value === selectedScope)?.label,
    [selectedScope]
  );

  const headingLabel = quoteHeadlineByScope[selectedScope];

  return (
    <form
      className="instant-quote form-grid"
      onSubmit={(event) => {
        event.preventDefault();
        if (!address.trim()) {
          setError("Please enter your exact address.");
          return;
        }
        void submit();
      }}
    >
      <h2>Instant {headingLabel} Quote</h2>
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

      <div className="instant-quote__input-row">
        <input
          id="address"
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

      {error ? <p style={{ color: "var(--color-primary)", margin: 0 }}>{error}</p> : null}
      {quoteId ? (
        <p className="instant-quote__success">
          Quote started. Request ID: <strong>{quoteId}</strong>
        </p>
      ) : null}
    </form>
  );
}
