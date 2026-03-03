"use client";

import { useEffect, useMemo, useState } from "react";
import { buildEstimateRanges, type ComplexityBand } from "@/lib/quote";

type NearbyItem = {
  lat: number;
  lng: number;
  address: string;
  roof_area_sqft: number | null;
  complexity_band: string | null;
  queried_at: string;
};

type Props = {
  coords: { lat: number; lng: number } | null;
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

export default function NearbyQuotesCarousel({ coords }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<NearbyItem[]>([]);

  useEffect(() => {
    if (!coords) {
      setItems([]);
      return;
    }

    const controller = new AbortController();
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams({ lat: String(coords.lat), lng: String(coords.lng), radiusKm: "25" });
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
  }, [coords]);

  const cards = useMemo(() => {
    return items.slice(0, 6).map((item, index) => {
      const area = Math.max(1200, item.roof_area_sqft ?? 1800);
      const complexity = normalizeComplexity(item.complexity_band);
      const ranges = buildEstimateRanges({ roofAreaSqft: area, pitchDegrees: 25, complexityBand: complexity });
      return {
        id: `${item.queried_at}-${index}`,
        address: item.address,
        complexity,
        roofArea: area,
        range: `$${ranges.good.low.toLocaleString()} - $${ranges.good.high.toLocaleString()}`,
        completed: timeAgo(item.queried_at)
      };
    });
  }, [items]);

  return (
    <section className="nearby-quotes">
      <div className="nearby-quotes__head">
        <div>
          <p className="nearby-quotes__kicker">Nearby estimate activity</p>
          <h2>Recent quotes within 25km</h2>
        </div>
      </div>

      {!coords ? <p className="instant-quote__meta">Estimate first to load nearby quote activity.</p> : null}
      {loading ? <p className="instant-quote__meta">Loading nearby quotes…</p> : null}
      {error ? <p className="instant-quote__error">{error}</p> : null}

      {cards.length > 0 ? (
        <div className="nearby-quotes__carousel" aria-live="polite">
          {cards.map((quote) => (
            <article key={quote.id} className="nearby-quotes__card">
              <p className="nearby-quotes__area">{quote.address}</p>
              <p>Service: Roofing</p>
              <p>Roof size: {quote.roofArea} sqft</p>
              <p>Complexity: {quote.complexity}</p>
              <p className="nearby-quotes__range">{quote.range}</p>
              <p className="nearby-quotes__time">{quote.completed}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
