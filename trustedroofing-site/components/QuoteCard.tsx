import Link from "next/link";
import type { QuoteCardData } from "@/lib/seo-engine";
import { formatRelativeTime } from "@/lib/time";

function currencyRange(low: number | null, high: number | null) {
  if (low === null || high === null) return "Live range available on request";
  return `$${Math.round(low).toLocaleString()} - $${Math.round(high).toLocaleString()}`;
}

function formatArea(value: number | null) {
  if (value === null || !Number.isFinite(value)) return null;
  return `${Math.round(value).toLocaleString()} sqft`;
}

function formatPitch(value: number | null) {
  if (value === null || !Number.isFinite(value)) return null;
  return `${Math.round(value)}° pitch`;
}

type Props = {
  quote: QuoteCardData;
  href?: string | null;
  variant?: "compact" | "full";
};

export default function QuoteCard({
  quote,
  href = `/quotes#quote-${quote.id}`,
  variant = "full"
}: Props) {
  const relativeTime = formatRelativeTime(quote.queriedAt);
  const areaLabel = formatArea(quote.roofAreaSqft);
  const pitchLabel = formatPitch(quote.pitchDegrees);
  const summary = variant === "compact"
    ? `Recent address-level ${quote.material.toLowerCase()} estimate generated for ${quote.locationLabel}.`
    : quote.description;

  const cardBody = (
    <>
      <div className="seo-card__content quote-card__content">
        <div className="quote-card__topline">
          <span className="ui-pill">Quote signal</span>
          <span className="quote-card__time">Updated {relativeTime}</span>
        </div>
        <h3>{quote.title}</h3>
        <p className="seo-card__eyebrow">{currencyRange(quote.estimateLow, quote.estimateHigh)}</p>
        <p className="quote-card__summary">{summary}</p>

        <dl className="quote-card__meta" aria-label="Quote signal details">
          <div>
            <dt>Service</dt>
            <dd>{quote.material}</dd>
          </div>
          <div>
            <dt>Locality</dt>
            <dd>{quote.locationLabel}</dd>
          </div>
          <div>
            <dt>Complexity</dt>
            <dd>{quote.complexity}</dd>
          </div>
          {pitchLabel ? (
            <div>
              <dt>Pitch</dt>
              <dd>{pitchLabel}</dd>
            </div>
          ) : null}
          {areaLabel ? (
            <div>
              <dt>Area</dt>
              <dd>{areaLabel}</dd>
            </div>
          ) : null}
        </dl>
      </div>
      {href ? <span className="quote-card__cta">View archive anchor</span> : null}
    </>
  );

  return (
    <article className={`ui-card ui-card--quote seo-card quote-card quote-card--${variant}`}>
      {href ? (
        <Link
          href={href}
          className="seo-card--link quote-card__link"
          aria-label={`Open quote archive entry for ${quote.title}`}
        >
          {cardBody}
        </Link>
      ) : cardBody}
    </article>
  );
}
