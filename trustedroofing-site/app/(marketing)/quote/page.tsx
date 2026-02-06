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
        <div>
          <h1 className="hero-title">Instant quote</h1>
          <p className="hero-subtitle">
            Trusted spin on a fast address-first quote. Roof is default, with
            All, Vinyl, Hardie, and Eavestrough one tap away.
          </p>
        </div>

        <NearbyQuotesCarousel />
        <QuoteFlow />

        <div className="quote-proof-grid">
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
