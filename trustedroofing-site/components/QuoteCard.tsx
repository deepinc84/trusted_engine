import Link from "next/link";
import type { QuoteCardData } from "@/lib/seo-engine";
import { formatRelativeTime, formatRelativeTimeCompact } from "@/lib/time";
import { buildPublicQuoteDisplay } from "@/lib/publicQuoteDisplay";

function currencyRange(low: number | null, high: number | null) {
  if (low === null || high === null) return "Live range available on request";
  return `$${Math.round(low).toLocaleString()} - $${Math.round(high).toLocaleString()}`;
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
  const publicQuoteDisplay = buildPublicQuoteDisplay({
    selectedScope: quote.scope,
    serviceType: quote.serviceType,
    requestedScopes: quote.requestedScopes,
    material: quote.material,
    roofAreaSqft: quote.roofAreaSqft,
    pitchDegrees: quote.pitchDegrees,
    complexityBand: quote.complexityBand,
    sidingAreaSqft: quote.sidingAreaSqft,
    eavesLengthLf: quote.eavesLengthLf,
    stories: quote.stories,
    estimateBasis: quote.estimateBasis
  });
  const compactItems = publicQuoteDisplay.supportingItems.slice(0, 2);

  const compactMeta = [
    { label: "Locality", value: quote.locationLabel },
    { label: "City / quadrant", value: quote.cityQuadrantLabel },
    ...compactItems.map((item) => ({ label: item.label, value: item.value })),
    { label: "Updated", value: relativeTime }
  ].filter((item): item is { label: string; value: string } => !!item.value);

  const fullMeta = [
    { label: "Service", value: quote.material },
    { label: "Locality", value: quote.locationLabel },
    { label: "City / quadrant", value: quote.cityQuadrantLabel },
    ...publicQuoteDisplay.supportingItems.map((item) => ({ label: item.label, value: item.value })),
    { label: "Updated", value: relativeTime }
  ];

  return (
    <article className={`ui-card ui-card--quote seo-card quote-card quote-card--${variant}`} id={variant === "full" && !href ? `quote-${quote.slug}` : undefined}>
      {href ? (
        <Link href={href} className="seo-card--link quote-card__link" aria-label={quote.title}>
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
          <span className="quote-card__cta">Open: {quote.title}</span>
        </Link>
      ) : (
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
      )}
    </article>
  );
}
