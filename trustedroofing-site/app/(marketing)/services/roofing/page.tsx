import ServiceSchema from "@/components/ServiceSchema";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Roofing",
  description: "High-performance roof replacements and new installs.",
  path: "/services/roofing"
});

export default function RoofingPage() {
  return (
    <section className="section">
      <ServiceSchema serviceName="Roofing" serviceType="Roofing" />
      <div className="hero" style={{ gridTemplateColumns: "1fr" }}>
        <div>
          <h1 className="hero-title">Roofing built for Alberta weather</h1>
          <p className="hero-subtitle">
            From tear-offs to upgrades, we deliver durable roofing systems and
            capture every material spec in our data pipeline.
          </p>
          <ul style={{ marginTop: 24, color: "var(--color-muted)" }}>
            <li>Class 4 impact-resistant shingles</li>
            <li>Ventilation and insulation audits</li>
            <li>Precise project documentation</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
