"use client";

import { useEffect, useMemo, useState } from "react";
import { buildEstimateRanges, type ComplexityBand } from "@/lib/quote";

type NearbyItem = {
  lat: number;
  lng: number;
  address: string;
  neighborhood: string | null;
  quadrant: string | null;
  city: string | null;
  roof_area_sqft: number | null;
  pitch_degrees: number | null;
  complexity_band: string | null;
  estimate_low: number | null;
  estimate_high: number | null;
  queried_at: string;
};

type Props = {
  coords: { lat: number; lng: number } | null;
  address: string | null;
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.round(diffMs / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function normalizeComplexity(input: string | null): ComplexityBand {
  return input === "simple" || input === "complex" ? input : "moderate";
}

export default function NearbyQuotesCarousel({ coords, address }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<NearbyItem[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams({ radiusKm: "25" });
        if (coords) {
          query.set("lat", String(coords.lat));
          query.set("lng", String(coords.lng));
        }
        if (address?.trim()) {
          query.set("address", address.trim());
        }
        const res = await fetch(`/api/instaquote/nearby?${query.toString()}`, { signal: controller.signal });
        const payload = (await res.json().catch(() => ({}))) as { items?: NearbyItem[]; error?: string };
        if (!res.ok) {
          setError(payload.error ?? "Unable to load nearby quotes.");
          setLoading(false);
          return;
        }
        setItems(payload.items ?? []);
      } catch {
        if (!controller.signal.aborted) {
          setError("Unable to load nearby quotes right now.");
        }
      }
      setLoading(false);
    };

    void run();
    return () => controller.abort();
  }, [coords, address]);

  const cards = useMemo(() => {
    return items.slice(0, 6).map((item, index) => {
      const area = item.roof_area_sqft ?? 1800;
      const pitchDegrees = typeof item.pitch_degrees === "number" && Number.isFinite(item.pitch_degrees)
        ? item.pitch_degrees
        : 25;
      const complexity = normalizeComplexity(item.complexity_band);
      const ranges = buildEstimateRanges({ roofAreaSqft: area, pitchDegrees, complexityBand: complexity });
      const estimateLow = typeof item.estimate_low === "number" && Number.isFinite(item.estimate_low)
        ? item.estimate_low
        : null;
      const estimateHigh = typeof item.estimate_high === "number" && Number.isFinite(item.estimate_high)
        ? item.estimate_high
        : null;
      const hasStoredRange = estimateLow !== null && estimateHigh !== null;
      return {
        id: `${item.queried_at}-${index}`,
        locationLabel: item.neighborhood ?? item.quadrant ?? item.city ?? "Calgary",
        address: item.address,
        complexity,
        roofArea: area,
        range: hasStoredRange
          ? `$${Math.round(estimateLow).toLocaleString()} - $${Math.round(estimateHigh).toLocaleString()}`
          : `$${ranges.good.low.toLocaleString()} - $${ranges.good.high.toLocaleString()}`,
        completed: timeAgo(item.queried_at)
      };
    });
  }, [items]);

  return (
    <section className="nearby-quotes">
      <div className="nearby-quotes__head">
        <div>
          <p className="nearby-quotes__kicker">Nearby estimate activity</p>
          <h2>Recent quotes near your address</h2>
        </div>
      </div>

      {!coords && !loading ? <p className="instant-quote__meta">Showing recent quote activity across nearby areas.</p> : null}
      {loading ? <p className="instant-quote__meta">Loading nearby quotes…</p> : null}
      {error ? <p className="instant-quote__error">{error}</p> : null}

      {cards.length > 0 ? (
        <div className="nearby-quotes__carousel" aria-live="polite">
          {cards.map((quote) => (
            <article key={quote.id} className="nearby-quotes__card">
              <p className="nearby-quotes__badge">{quote.locationLabel}</p>
              <p className="nearby-quotes__area">{quote.range}</p>
              <p className="nearby-quotes__detail">Roof size: {quote.roofArea} sqft · Complexity: {quote.complexity}</p>
              <p className="nearby-quotes__time">{quote.completed}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
