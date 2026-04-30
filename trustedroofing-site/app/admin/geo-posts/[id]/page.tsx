import Link from "next/link";
import { listAdminGeoPosts, getProjectById } from "@/lib/db";
import AdminTabs from "@/app/admin/_components/AdminTabs";

export default async function GeoPostDetailPage({ params }: { params: { id: string } }) {
  const posts = await listAdminGeoPosts(500);
  const post = posts.find((item) => item.id === params.id);
  if (!post) {
    return <section className="section"><p>Geo-post not found.</p></section>;
  }

  const project = await getProjectById(post.project_id);

  return (
    <section className="section" style={{ maxWidth: 880 }}>
      <h1 className="hero-title">Geo-post detail</h1>
      <AdminTabs currentPath="/admin/geo-posts" />
      <p><Link href="/admin/geo-posts">← Back to geo-posts</Link></p>
      <p>Project source: <Link href={`/admin/projects/${post.project_id}/edit`}>{project?.title ?? post.project_id}</Link></p>
      <p>Project summary: {project?.summary ?? "n/a"}</p>
      <p>Project description: {project?.description ?? "No original project description saved."}</p>
      <form method="POST" action={`/admin/geo-posts/${post.id}/update`} style={{ display: "grid", gap: 10 }}>
        <label>
          Status
          <select className="input" name="status" defaultValue={post.status}>
            <option value="draft">draft</option>
            <option value="queued">queued</option>
            <option value="published">published</option>
            <option value="failed">failed</option>
          </select>
        </label>
        <label>
          Content
          <textarea className="input input--multiline" rows={10} name="content" defaultValue={post.content ?? ""} />
        </label>
        <button className="button" type="submit">Save geo-post</button>
      </form>
      <form method="POST" action={`/admin/geo-posts/${post.id}/publish`} style={{ marginTop: 10 }}>
        <button className="button" type="submit">Publish now</button>
      </form>
    </section>
  );
}
