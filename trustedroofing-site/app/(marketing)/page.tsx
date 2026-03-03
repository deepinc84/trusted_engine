import Link from "next/link";
import HeatMap from "@/components/HeatMap";
import GeoProjectsRail from "@/components/GeoProjectsRail";
import LocalBusinessSchema from "@/components/LocalBusinessSchema";
import { listProjects } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Roofing & exterior services in Calgary",
  description:
    "Modern, fast roofing and exterior services with local project insights for Calgary homeowners.",
  path: "/"
});

export default async function HomePage() {
  const initialProjects = await listProjects({ limit: 5, include_unpublished: false });

  return (
    <>
      <LocalBusinessSchema />
      <section className="section">
        <div className="hero">
          <div>
            <span className="badge">Fast estimates • Clean data • Real project graph</span>
            <h1 className="hero-title">
              Trusted Roofing & Exteriors for Calgary homeowners.
            </h1>
            <p className="hero-subtitle">
              Crawl-safe Calgary defaults are rendered server-side, then refined on
              the client for near-you context after consent.
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
          <GeoProjectsRail initialProjects={initialProjects} />
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="card-grid">
          <div className="card">
            <h3>Hub-spoke content graph</h3>
            <p style={{ color: "var(--color-muted)", marginTop: 12 }}>
              Service hubs link to real project nodes. No doorway neighborhood pages.
            </p>
          </div>
          <div className="card">
            <h3>GeoBoost data pipeline</h3>
            <p style={{ color: "var(--color-muted)", marginTop: 12 }}>
              Admin publishing writes to Supabase and enqueues GBP posts.
            </p>
          </div>
          <HeatMap />
        </div>
      </section>
    </>
  );
}
