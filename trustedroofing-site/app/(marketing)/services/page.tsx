import Link from "next/link";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Services",
  description: "Roofing, roof repair, and exterior services in Calgary.",
  path: "/services"
});

export default function ServicesPage() {
  return (
    <section className="section">
      <div className="hero" style={{ gridTemplateColumns: "1fr" }}>
        <div>
          <h1 className="hero-title">Roofing & exterior services</h1>
          <p className="hero-subtitle">
            Explore our core service lines designed for speed, durability, and
            data capture.
          </p>
        </div>
      </div>
      <div className="card-grid" style={{ marginTop: 32 }}>
        <div className="card">
          <h3>Roofing</h3>
          <p style={{ color: "var(--color-muted)", marginTop: 12 }}>
            Full replacements, upgrades, and new builds.
          </p>
          <Link href="/services/roofing" style={{ fontWeight: 600 }}>
            Learn more →
          </Link>
        </div>
        <div className="card">
          <h3>Roof repair</h3>
          <p style={{ color: "var(--color-muted)", marginTop: 12 }}>
            Storm response, leak detection, and targeted fixes.
          </p>
          <Link href="/services/roof-repair" style={{ fontWeight: 600 }}>
            Learn more →
          </Link>
        </div>
      </div>
    </section>
  );
}
