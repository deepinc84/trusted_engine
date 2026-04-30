import { listAdminGeoPosts, listProjects } from "@/lib/db";
import Link from "next/link";
import AdminTabs from "@/app/admin/_components/AdminTabs";

export default async function GeoPostsAdminPage({
  searchParams
}: {
  searchParams?: { projectId?: string };
}) {
  const selectedProjectId = searchParams?.projectId;
  const [geoPosts, projects] = await Promise.all([
    listAdminGeoPosts(300),
    listProjects({ include_unpublished: true, limit: 500 })
  ]);
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const filteredPosts = selectedProjectId
    ? geoPosts.filter((post) => post.project_id === selectedProjectId)
    : geoPosts;
  const linkedProjectIds = new Set(geoPosts.map((post) => post.project_id));
  const unlinkedProjects = projects.filter((project) => !linkedProjectIds.has(project.id));

  return (
    <section className="section">
      <h1 className="hero-title">Geo-post management</h1>
      <p className="hero-subtitle">List, edit content/state, and publish posts to service pages (plus GBP when pipeline is live).</p>
      <AdminTabs currentPath="/admin/geo-posts" />
      {selectedProjectId ? (
        <p style={{ marginTop: 12 }}>
          Filtering to project: <strong>{projectById.get(selectedProjectId)?.title ?? selectedProjectId}</strong>{" "}
          <Link href="/admin/geo-posts">(clear)</Link>
        </p>
      ) : null}
      <div style={{ marginTop: 24 }}>
        <h2 className="homev3-title" style={{ fontSize: "1.5rem" }}>Projects needing geo-posts</h2>
        <p className="hero-subtitle">These projects do not yet have a linked geo-post draft.</p>
        <div className="card-grid" style={{ marginTop: 12 }}>
          {unlinkedProjects.map((project) => (
            <article key={project.id} className="card">
              <h3>{project.title}</h3>
              <p>{project.address_private ?? "Address unavailable"}</p>
              <p>Summary: {project.summary}</p>
              <p>Description: {project.description ?? "No original project description saved."}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <Link href={`/admin/projects/${project.id}/geo-post`} className="button">Create geo-post draft</Link>
                <Link href={`/admin/projects/${project.id}/edit`} className="button button--ghost">Open project</Link>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="card-grid" style={{ marginTop: 20 }}>
        {filteredPosts.map((post) => {
          const project = projectById.get(post.project_id);
          return (
            <article key={post.id} className="card">
              <h3>{post.title ?? "Untitled geo-post"}</h3>
              <p>Project: {project?.title ?? post.project_id}</p>
              <p>Address context: {project?.address_private ?? "unknown"}</p>
              <p>Status: <strong>{post.status}</strong></p>
              <p>Published at: {post.published_at ? new Date(post.published_at).toLocaleString("en-CA") : "not published"}</p>
              <p>Publish result: {post.gbp_response ? "available" : "none"}</p>
              <p>Project summary: {project?.summary ?? "n/a"}</p>
              <p>Project source: {project?.description ?? "No long-form project description saved."}</p>
              <p>
                <Link href={`/admin/projects/${post.project_id}/edit`}>Open original project</Link>
                {" · "}
                <Link href={`/admin/geo-posts/${post.id}`}>Open geo-post detail</Link>
              </p>
              <form method="POST" action={`/admin/geo-posts/${post.id}/publish`}>
                <button className="button" type="submit">Publish</button>
              </form>
            </article>
          );
        })}
      </div>
    </section>
  );
}
