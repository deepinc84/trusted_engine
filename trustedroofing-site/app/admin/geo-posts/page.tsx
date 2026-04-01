import { listAdminGeoPosts, listProjects } from "@/lib/db";
import Link from "next/link";

export default async function GeoPostsAdminPage() {
  const [geoPosts, projects] = await Promise.all([
    listAdminGeoPosts(300),
    listProjects({ include_unpublished: true, limit: 500 })
  ]);
  const projectById = new Map(projects.map((project) => [project.id, project]));

  return (
    <section className="section">
      <h1 className="hero-title">Geo-post management</h1>
      <p className="hero-subtitle">List, edit content/state, and publish posts to GBP queue.</p>
      <div className="card-grid" style={{ marginTop: 20 }}>
        {geoPosts.map((post) => (
          <article key={post.id} className="card">
            <h3>{post.title ?? "Untitled geo-post"}</h3>
            <p>Address context: {projectById.get(post.project_id)?.address_private ?? "unknown"}</p>
            <p>Project: {projectById.get(post.project_id)?.title ?? post.project_id}</p>
            <p>Status: <strong>{post.status}</strong></p>
            <p>Published at: {post.published_at ? new Date(post.published_at).toLocaleString("en-CA") : "not published"}</p>
            <p>Publish result: {post.gbp_response ? "available" : "none"}</p>
            <p><Link href={`/admin/geo-posts/${post.id}`}>Open detail</Link></p>
            <form method="POST" action={`/admin/geo-posts/${post.id}/publish`}>
              <button className="button" type="submit">Publish</button>
            </form>
          </article>
        ))}
      </div>
    </section>
  );
}
