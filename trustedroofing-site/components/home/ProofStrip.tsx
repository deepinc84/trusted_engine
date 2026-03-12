import type { HomeMetric } from "./types";

export default function ProofStrip({ metrics }: { metrics: HomeMetric[] }) {
  return (
    <section className="homev3-proof-strip">
      <div className="homev3-container homev3-proof-strip__grid">
        {metrics.slice(0, 5).map((metric) => (
          <article key={metric.id}>
            <strong>{metric.value_text}</strong>
            <p>{metric.label}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
