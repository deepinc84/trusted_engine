import ServiceSchema from "@/components/ServiceSchema";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Solar integration",
  description:
    "Solar-ready roofing and partner-installed solar systems through Trusted Roofing & Exteriors.",
  path: "/services/solar"
});

export default function SolarPage() {
  return (
    <section className="section">
      <ServiceSchema serviceName="Solar integration" serviceType="Solar" />
      <div className="hero" style={{ gridTemplateColumns: "1fr" }}>
        <div>
          <h1 className="hero-title">Solar-ready exterior systems</h1>
          <p className="hero-subtitle">
            Trusted handles roofing + envelope planning, with solar delivered by
            our electrical partner network.
          </p>
          <ul style={{ marginTop: 24, color: "var(--color-muted)" }}>
            <li>Roof condition + layout review for panels</li>
            <li>Coordinate installs with electrical partner crews</li>
            <li>TODO: connect Solar API and irradiance scoring</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
