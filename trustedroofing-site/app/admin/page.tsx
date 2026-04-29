import Link from "next/link";
import { listProjects } from "@/lib/db";
import ProjectCard from "@/components/ProjectCard";
import AdminTabs from "@/app/admin/_components/AdminTabs";

export default async function AdminDashboardPage() {
  const projects = await listProjects({ include_unpublished: true, limit: 100 });

  return (
    <section className="section">
      <div className="hero" style={{ gridTemplateColumns: "1fr" }}>
        <div>
          <h1 className="hero-title">GeoBoost Admin</h1>
          <p className="hero-subtitle">Manage project nodes, linked geo_posts, and project photo galleries.</p>
          <AdminTabs currentPath="/admin" />
        </div>
      </div>
      <div className="ui-grid ui-grid--projects" style={{ marginTop: 24 }}>
        {projects.map((project) => (
          <div key={project.id} style={{ display: "grid", gap: 10 }}>
            <ProjectCard project={project} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <Link href={`/admin/projects/${project.id}/edit`} className="button button--ghost">
                Edit in admin
              </Link>
              <form method="POST" action={`/admin/projects/${project.id}/geo-post`}>
                <button className="button" type="submit">Create geo-post draft</button>
              </form>
              <Link href={`/admin/geo-posts?projectId=${project.id}`} className="button button--ghost">
                Preview geo-posts
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
