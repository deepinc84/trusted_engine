"use client";

import { useEffect, useMemo, useState } from "react";
import QuoteCard from "@/components/QuoteCard";
import { buildEstimateRanges, type ComplexityBand } from "@/lib/quote";
import { buildQuoteAnchorSlug, buildQuoteSignalTitle, quoteComplexityLabel, quoteMaterialLabel, resolvePublicLocation } from "@/lib/serviceAreas";

type NearbyItem = {
  lat: number;
  lng: number;
  address: string;
  neighborhood: string | null;
  quadrant: string | null;
  city: string | null;
  service_type: string | null;
  requested_scopes: string[] | null;
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
      const location = resolvePublicLocation({
        neighborhood: item.neighborhood,
        city: item.city,
        quadrant: item.quadrant,
        address: item.address
      });
      const material = quoteMaterialLabel(item.service_type, item.requested_scopes);
      const complexityLabel = quoteComplexityLabel(item.complexity_band);

      return {
        id: `${item.queried_at}-${index}`,
        locality: location.locality,
        neighborhood: location.locality,
        slug: buildQuoteAnchorSlug(material, location.locality, location.city, `${item.queried_at}-${index}`),
        city: location.city,
        locationLabel: location.label,
        cityQuadrantLabel: location.cityQuadrantLabel,
        locationKind: location.kind,
        quadrant: location.quadrant,
        complexity: complexityLabel,
        material,
        estimateLow: hasStoredRange ? estimateLow : ranges.good.low,
        estimateHigh: hasStoredRange ? estimateHigh : ranges.good.high,
        roofAreaSqft: area,
        pitchDegrees,
        queriedAt: item.queried_at,
        title: buildQuoteSignalTitle(material, location.locality, location.city),
        description: `Recent address-level ${material.toLowerCase()} estimate generated for this area. Modeled estimate signal based on recent local property inputs.`
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
        <div className="nearby-quotes__grid" aria-live="polite">
          {cards.map((quote) => (
            <QuoteCard key={quote.id} quote={quote} variant="compact" />
          ))}
        </div>
      ) : null}
    </section>
  );
}
