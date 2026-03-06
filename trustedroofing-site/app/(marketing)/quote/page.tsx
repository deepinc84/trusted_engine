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
            Get your estimate in minutes with address autocomplete, roof-data pricing, and nearby project proof.
          </p>
        </div>
        <div className="quote-shell__form">
          <QuoteFlow />
        </div>
      </div>
    </section>
  );
}
