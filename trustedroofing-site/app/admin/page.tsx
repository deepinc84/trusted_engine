import Link from "next/link";
import { listProjects } from "@/lib/db";

export default async function AdminDashboardPage() {
  const projects = await listProjects({ include_unpublished: true, limit: 100 });

  return (
    <section className="section">
      <div className="hero" style={{ gridTemplateColumns: "1fr" }}>
        <div>
          <h1 className="hero-title">GeoBoost Admin</h1>
          <p className="hero-subtitle">Manage project nodes and queue GBP post payloads.</p>
          <div style={{ marginTop: 16 }}>
            <Link href="/admin/projects/new" className="button">
              Create project
            </Link>
          </div>
        </div>
      </div>
      <div className="card-grid" style={{ marginTop: 24 }}>
        {projects.map((project) => (
          <article key={project.id} className="card">
            <h3>{project.title}</h3>
            <p style={{ color: "var(--color-muted)", marginTop: 8 }}>{project.slug}</p>
            <p style={{ marginTop: 8 }}>{project.summary}</p>
            <Link href={`/admin/projects/${project.id}/edit`} style={{ marginTop: 12, display: "inline-block", fontWeight: 600 }}>
              Edit →
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
