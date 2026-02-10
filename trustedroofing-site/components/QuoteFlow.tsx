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
      {
        headers: {
          Accept: "application/json"
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    const results = (await response.json()) as Array<{
      display_name?: string;
      lat?: string;
      lon?: string;
      address?: {
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
        state?: string;
        postcode?: string;
      };
    }>;

    const top = results[0];

    if (!top?.lat || !top?.lon || !top?.display_name) {
      return null;
    }

    return {
      fullAddress: top.display_name,
      city:
        top.address?.city ??
        top.address?.town ??
        top.address?.village ??
        top.address?.municipality ??
        "Calgary",
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<ResolvedAddress | null>(null);
  const [addressResolutionNotice, setAddressResolutionNotice] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setIsSubmitting(true);
    setAddressResolutionNotice(null);

    let resolved: ResolvedAddress | null = null;

    setIsResolvingAddress(true);
    resolved = await resolveAddress(address);
    setIsResolvingAddress(false);

    if (!resolved) {
      setAddressResolutionNotice(
        "We could not verify your address automatically yet. Your typed address was saved and we defaulted city-level data to Calgary."
      );
    } else {
      setResolvedAddress(resolved);
      setAddressResolutionNotice("Address found and matched.");
    }

    const payload: Step1Payload = {
      address: resolved?.fullAddress ?? address,
      city: resolved?.city ?? "Calgary",
      province: resolved?.province ?? "AB",
      postal: resolved?.postal ?? "",
      lat: resolved?.lat ?? 0,
      lng: resolved?.lng ?? 0,
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
        <button className="button" type="submit" disabled={isSubmitting || isResolvingAddress}>
          {isResolvingAddress
            ? "Finding address..."
            : isSubmitting
              ? "Submitting..."
              : "Get My Instant Estimate"}
        </button>
      </div>

      <p className="instant-quote__meta">Selected scope: {selectedLabel}</p>

      {addressResolutionNotice ? (
        <p className="instant-quote__resolution-note">{addressResolutionNotice}</p>
      ) : null}
      {resolvedAddress ? (
        <p className="instant-quote__resolution-detail">
          Matched address: <strong>{resolvedAddress.fullAddress}</strong>
        </p>
      ) : null}
      {error ? <p style={{ color: "var(--color-primary)", margin: 0 }}>{error}</p> : null}
      {quoteId ? (
        <p className="instant-quote__success">
          Quote started. Request ID: <strong>{quoteId}</strong>
        </p>
      ) : null}
    </form>
  );
}
