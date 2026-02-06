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
      <div className="hero" style={{ gridTemplateColumns: "1fr" }}>
        <div>
          <h1 className="hero-title">Instant quote</h1>
          <p className="hero-subtitle">
            Start with a scope selection (roof, siding, soft metals, solar) and move through a fast quote flow.
          </p>
        </div>
      </div>
      <QuoteFlow />
    </section>
  );
}
