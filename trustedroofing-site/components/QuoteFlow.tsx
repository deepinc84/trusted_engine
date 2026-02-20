"use client";

import { useEffect, useMemo, useState } from "react";
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
    const query = new URLSearchParams({ address });
    const response = await fetch(`/api/geocode?${query.toString()}`, {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as {
      ok?: boolean;
      result?: ResolvedAddress | null;
    };

    return payload.ok ? payload.result ?? null : null;
  } catch {
    return null;
  }
}

export default function QuoteFlow() {
  const [selectedScope, setSelectedScope] = useState<QuoteScope>("roofing");
  const [address, setAddress] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
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

  useEffect(() => {
    if (address.trim().length < 3 || quoteId) {
      setAddressSuggestions([]);
      return;
    }

    const timeout = setTimeout(() => {
      const query = new URLSearchParams({ q: address.trim() });
      fetch(`/api/geocode/suggest?${query.toString()}`)
        .then(async (res) => {
          if (!res.ok) return { suggestions: [] as string[] };
          return (await res.json()) as { suggestions?: string[] };
        })
        .then((data) => setAddressSuggestions(data.suggestions ?? []))
        .catch(() => setAddressSuggestions([]));
    }, 250);

    return () => clearTimeout(timeout);
  }, [address, quoteId]);

  const submitStep1 = async () => {
    setError(null);
    setIsSubmitting(true);
    setResolutionMessage(null);

    try {
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

      const text = await res.text();
      const data = text ? (JSON.parse(text) as { error?: string; quote_id?: string }) : {};
      setIsSubmitting(false);

      if (!res.ok) {
        setError(data.error ?? "Unable to start quote.");
        return;
      }

      setQuoteId(data.quote_id ?? null);
      setResolutionMessage(
        resolved
          ? `Address matched: ${resolved.fullAddress}`
          : "Address saved. Automatic geocode unavailable; city defaults may apply."
      );
    } catch {
      setIsSubmitting(false);
      setError("Unable to start quote right now. Please try again.");
    }
  };

  const submitStep2 = async () => {
    if (!quoteId) return;
    setError(null);
    setIsSubmitting(true);

    try {
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

      const text = await res.text();
      const data = text ? (JSON.parse(text) as { error?: string }) : {};
      setIsSubmitting(false);
      if (!res.ok) {
        setError(data.error ?? "Unable to save contact details.");
        return;
      }

      setStep2Done(true);
    } catch {
      setIsSubmitting(false);
      setError("Unable to save contact details right now. Please try again.");
    }
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
              list="quote-address-suggestions"
              required
            />
            <datalist id="quote-address-suggestions">
              {addressSuggestions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
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
