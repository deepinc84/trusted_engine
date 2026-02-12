import NearbyQuotesCarousel from "@/components/NearbyQuotesCarousel";
import QuoteFlow from "@/components/QuoteFlow";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Instant quote",
  description: "Start your instant roofing estimate in seconds.",
  path: "/quote"
});

export default function QuotePage() {
  return (
    <section className="section">
      <div className="quote-shell">
        <div className="quote-shell__intro">
          <h1 className="hero-title">Instant quote</h1>
          <p className="hero-subtitle">
            Trusted spin on a fast address-first quote. Roof is default, with
            All, Vinyl, Hardie, and Eavestrough one tap away.
          </p>
        </div>

        <div className="quote-shell__nearby">
          <NearbyQuotesCarousel />
        </div>

        <div className="quote-shell__form">
          <QuoteFlow />
        </div>

        <div className="quote-shell__proof quote-proof-grid">
          <div className="quote-proof-card">
            <strong>≈ 60s</strong>
            <span>Fast first number</span>
          </div>
          <div className="quote-proof-card">
            <strong>No pressure</strong>
            <span>No obligation estimate</span>
          </div>
          <div className="quote-proof-card">
            <strong>±5%</strong>
            <span>Typical initial range</span>
          </div>
        </div>
      </div>
    </section>
  );
}
