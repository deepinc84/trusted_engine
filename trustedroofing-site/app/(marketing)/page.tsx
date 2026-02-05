import Link from "next/link";
import HeatMap from "@/components/HeatMap";
import LocalBusinessSchema from "@/components/LocalBusinessSchema";
import LocationProjects from "@/components/LocationProjects";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Roofing & exterior services in Calgary",
  description:
    "Modern, fast roofing and exterior services with local project insights for Calgary homeowners.",
  path: "/"
});

export default function HomePage() {
  return (
    <>
      <LocalBusinessSchema />
      <section className="section">
        <div className="hero">
          <div>
            <span className="badge">Fast estimates • Clean data • Local work</span>
            <h1 className="hero-title">
              Trusted Roofing & Exteriors for Calgary homeowners.
            </h1>
            <p className="hero-subtitle">
              We blend high-performance roofing crews with data-backed planning to
              deliver accurate, fast, and transparent projects.
            </p>
            <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
              <Link href="/quote" className="button">
                Start instant quote
              </Link>
              <Link
                href="/projects"
                className="button"
                style={{
                  background: "white",
                  color: "var(--color-primary)",
                  border: "1px solid rgba(30, 58, 138, 0.2)"
                }}
              >
                View projects
              </Link>
            </div>
          </div>
          <LocationProjects />
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="card-grid">
          <div className="card">
            <h3>Instant project intelligence</h3>
            <p style={{ color: "var(--color-muted)", marginTop: 12 }}>
              We capture clean project data to fuel better estimates and smarter
              planning.
            </p>
          </div>
          <div className="card">
            <h3>Certified crews</h3>
            <p style={{ color: "var(--color-muted)", marginTop: 12 }}>
              Experienced roofing and exterior specialists focused on quality and
              speed.
            </p>
          </div>
          <HeatMap />
        </div>
      </section>
    </>
  );
}
