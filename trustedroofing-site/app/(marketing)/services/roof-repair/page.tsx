import ServiceSchema from "@/components/ServiceSchema";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Roof repair",
  description: "Emergency and preventative roof repair services.",
  path: "/services/roof-repair"
});

export default function RoofRepairPage() {
  return (
    <section className="section">
      <ServiceSchema serviceName="Roof repair" serviceType="Roof repair" />
      <div className="hero" style={{ gridTemplateColumns: "1fr" }}>
        <div>
          <h1 className="hero-title">Rapid roof repair response</h1>
          <p className="hero-subtitle">
            Our crews handle storm response, leak diagnostics, and proactive
            maintenance with clean data capture.
          </p>
          <ul style={{ marginTop: 24, color: "var(--color-muted)" }}>
            <li>Same-day emergency response available</li>
            <li>Repair-only and preventative maintenance</li>
            <li>Photo documentation for every visit</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
