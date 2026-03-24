import Link from "next/link";
import type { QuoteCardData } from "@/lib/seo-engine";
import { formatRelativeTime, formatRelativeTimeCompact } from "@/lib/time";

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
  const rise = Math.max(0, Math.round(Math.tan((value * Math.PI) / 180) * 12));
  return `${rise}/12`;
}

type Props = {
  quote: QuoteCardData;
  href?: string | null;
  variant?: "compact" | "full";
};

export default function QuoteCard({
  quote,
  href = `/quotes#${quote.slug}`,
  variant = "full"
}: Props) {
  const compact = variant === "compact";
  const relativeTime = compact ? formatRelativeTimeCompact(quote.queriedAt) : formatRelativeTime(quote.queriedAt);
  const areaLabel = formatArea(quote.roofAreaSqft);
  const pitchLabel = formatPitch(quote.pitchDegrees);

  const compactMeta = [
    { label: "Sqft", value: areaLabel },
    { label: "Pitch", value: pitchLabel },
    { label: "Updated", value: relativeTime }
  ].filter((item): item is { label: string; value: string } => !!item.value);

  const fullMeta = [
    { label: "Service", value: quote.material },
    { label: "Locality", value: quote.locationLabel },
    { label: "City / quadrant", value: quote.cityQuadrantLabel },
    { label: "Complexity", value: quote.complexity },
    ...(pitchLabel ? [{ label: "Pitch", value: pitchLabel }] : []),
    ...(areaLabel ? [{ label: "Area", value: areaLabel }] : []),
    { label: "Updated", value: relativeTime }
  ];

  const cardBody = (
    <>
      <div className="seo-card__content quote-card__content">
        <div className="quote-card__topline">
          <span className="ui-pill">Quote signal</span>
          {!compact ? <span className="quote-card__time">Updated {relativeTime}</span> : null}
        </div>
        <h3>{quote.title}</h3>
        <p className="seo-card__eyebrow">{currencyRange(quote.estimateLow, quote.estimateHigh)}</p>
        {!compact ? <p className="quote-card__summary">{quote.description}</p> : null}

        <dl className={`quote-card__meta quote-card__meta--${variant}`} aria-label="Quote signal details">
          {(compact ? compactMeta : fullMeta).map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      {href ? <span className="quote-card__cta">View quote archive</span> : null}
    </>
  );

  return (
    <article className={`ui-card ui-card--quote seo-card quote-card quote-card--${variant}`} id={variant === "full" && !href ? `quote-${quote.slug}` : undefined}>
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
