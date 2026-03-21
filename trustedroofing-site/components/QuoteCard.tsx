import Link from "next/link";
import type { QuoteCardData } from "@/lib/seo-engine";

function currencyRange(low: number | null, high: number | null) {
  if (low === null || high === null) return "Live range available on request";
  return `$${Math.round(low).toLocaleString()} - $${Math.round(high).toLocaleString()}`;
}

type Props = {
  quote: QuoteCardData;
  href?: string | null;
};

export default function QuoteCard({
  quote,
  href = `/quotes#quote-${quote.id}`
}: Props) {
  const content = (
    <>
      <div className="seo-card__content">
        <span className="ui-pill">Quote signal</span>
        <h3>{quote.neighborhood}</h3>
        <p className="seo-card__eyebrow">{currencyRange(quote.estimateLow, quote.estimateHigh)}</p>
        <p className="seo-card__summary seo-card__summary--clamped">{quote.description}</p>
      </div>

      <div className="seo-card__overlay" aria-hidden="true">
        <p><strong>Complexity:</strong> {quote.complexity}</p>
        <p><strong>Material:</strong> {quote.material}</p>
        <p><strong>Neighborhood:</strong> {quote.neighborhood}</p>
      </div>
    </>
  );

  if (!href) {
    return <article className="ui-card ui-card--quote seo-card">{content}</article>;
  }

  return (
    <Link
      href={href}
      className="ui-card ui-card--quote seo-card seo-card--link"
      aria-label={`Open quote archive entry for ${quote.neighborhood}`}
    >
      {content}
    </Link>
  );
}
