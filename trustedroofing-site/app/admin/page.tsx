import Link from "next/link";
import { listProjects } from "@/lib/db";
import ProjectCard from "@/components/ProjectCard";

export default async function AdminDashboardPage() {
  const projects = await listProjects({ include_unpublished: true, limit: 100 });

  return (
    <section className="section">
      <div className="hero" style={{ gridTemplateColumns: "1fr" }}>
        <div>
          <h1 className="hero-title">GeoBoost Admin</h1>
          <p className="hero-subtitle">Manage project nodes, linked geo_posts, and project photo galleries.</p>
          <div style={{ marginTop: 16 }}>
            <Link href="/admin/projects/new" className="button">
              Create project
            </Link>
            <Link href="/admin/instant-quotes" className="button" style={{ marginLeft: 10 }}>
              Instant quote dashboard
            </Link>
            <Link href="/admin/actuals" className="button" style={{ marginLeft: 10 }}>
              Actuals tab
            </Link>
            <Link href="/admin/geo-posts" className="button" style={{ marginLeft: 10 }}>
              Geo-post management
            </Link>
            <Link href="/admin/reports" className="button" style={{ marginLeft: 10 }}>
              Reporting
            </Link>
          </div>
        </div>
      </div>
      <div className="ui-grid ui-grid--projects" style={{ marginTop: 24 }}>
        {projects.map((project) => (
          <div key={project.id} style={{ display: "grid", gap: 10 }}>
            <ProjectCard project={project} />
            <Link href={`/admin/projects/${project.id}/edit`} className="button button--ghost">
              Edit in admin
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
