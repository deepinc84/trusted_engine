import Image from "next/image";
import { listAdminGeoPosts, listProjects, type Project } from "@/lib/db";
import Link from "next/link";
import AdminTabs from "@/app/admin/_components/AdminTabs";
import { getPlaceholderProjectImage } from "@/lib/images";

function getPostImage(postImage: string | null, project: Project | undefined) {
  return postImage ?? project?.photos?.[0]?.public_url ?? getPlaceholderProjectImage({
    seed: project?.slug ?? "geo-post",
    neighborhood: project?.neighborhood ?? null,
    quadrant: project?.quadrant ?? null,
    city: project?.city ?? "Calgary"
  });
}

function statusLabel(status: string) {
  if (status === "published") return "Live / published";
  if (status === "queued") return "Queued";
  if (status === "failed") return "Failed";
  return "Draft";
}

export default async function GeoPostsAdminPage({
  searchParams
}: {
  searchParams?: { projectId?: string; status?: string };
}) {
  const selectedProjectId = searchParams?.projectId;
  const selectedStatus = searchParams?.status ?? "all";
  const [geoPosts, projects] = await Promise.all([
    listAdminGeoPosts(300),
    listProjects({ include_unpublished: true, limit: 500 })
  ]);
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const filteredPosts = geoPosts
    .filter((post) => !selectedProjectId || post.project_id === selectedProjectId)
    .filter((post) => selectedStatus === "all" || post.status === selectedStatus);
  const linkedProjectIds = new Set(geoPosts.map((post) => post.project_id));
  const unlinkedProjects = projects.filter((project) => !linkedProjectIds.has(project.id));
  const liveCount = geoPosts.filter((post) => post.status === "published").length;
  const draftCount = geoPosts.filter((post) => post.status === "draft").length;
  const queuedCount = geoPosts.filter((post) => post.status === "queued").length;
  const failedCount = geoPosts.filter((post) => post.status === "failed").length;

  return (
    <section className="section admin-shell">
      <div className="admin-hero">
        <div>
          <p className="admin-kicker">Publishing</p>
          <h1 className="hero-title">Geo-post management</h1>
          <p className="hero-subtitle">See live posts, drafts, missing project posts, source photos, and publishing actions in one place.</p>
        </div>
        <Link href="/admin" className="button button--ghost">Back to admin overview</Link>
      </div>
      <AdminTabs currentPath="/admin/geo-posts" />

      <div className="admin-stat-grid" aria-label="Geo-post status counts">
        <Link href="/admin/geo-posts?status=published" className="admin-stat-card admin-stat-card--success">
          <span>Live geo-posts</span><strong>{liveCount}</strong><em>Published and visible</em>
        </Link>
        <Link href="/admin/geo-posts?status=draft" className="admin-stat-card admin-stat-card--warning">
          <span>Drafts</span><strong>{draftCount}</strong><em>Needs review/publish</em>
        </Link>
        <Link href="/admin/geo-posts?status=queued" className="admin-stat-card">
          <span>Queued</span><strong>{queuedCount}</strong><em>Waiting on pipeline</em>
        </Link>
        <Link href="/admin/geo-posts?status=failed" className="admin-stat-card admin-stat-card--danger">
          <span>Failed</span><strong>{failedCount}</strong><em>Needs fix</em>
        </Link>
      </div>

      {selectedProjectId || selectedStatus !== "all" ? (
        <div className="admin-filter-note">
          <span>
            Showing {selectedStatus === "all" ? "all statuses" : statusLabel(selectedStatus)}
            {selectedProjectId ? ` for ${projectById.get(selectedProjectId)?.title ?? selectedProjectId}` : ""}.
          </span>
          <Link href="/admin/geo-posts">Clear filters</Link>
        </div>
      ) : null}

      <div id="needs-geo-post" className="admin-section-heading">
        <div>
          <p className="admin-kicker">Missing drafts</p>
          <h2 className="homev3-title">Projects needing geo-posts</h2>
        </div>
        <p>{unlinkedProjects.length} project{unlinkedProjects.length === 1 ? "" : "s"} do not yet have a linked geo-post draft.</p>
      </div>

      {unlinkedProjects.length > 0 ? (
        <div className="admin-project-grid admin-project-grid--compact">
          {unlinkedProjects.map((project) => {
            const image = getPostImage(null, project);
            return (
              <article key={project.id} className="admin-project-card">
                <div className="admin-card-media">
                  <Image src={image} alt="" width={640} height={420} />
                  <span className="admin-status-pill is-missing">No geo-post</span>
                </div>
                <div className="admin-project-card__body">
                  <h3>{project.title}</h3>
                  <p className="admin-muted">{project.address_private ?? "Address unavailable"}</p>
                  <p>{project.summary}</p>
                </div>
                <div className="admin-action-row">
                  <form method="POST" action={`/admin/projects/${project.id}/geo-post`}>
                    <button className="button" type="submit">Create geo-post draft</button>
                  </form>
                  <Link href={`/admin/projects/${project.id}/edit`} className="button button--ghost">Open project</Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="admin-empty-state">Every project currently has a geo-post record.</div>
      )}

      <div className="admin-section-heading">
        <div>
          <p className="admin-kicker">All geo-posts</p>
          <h2 className="homev3-title">Geo-post library</h2>
        </div>
        <p>{filteredPosts.length} post{filteredPosts.length === 1 ? "" : "s"} shown.</p>
      </div>

      {filteredPosts.length > 0 ? (
        <div className="admin-project-grid">
          {filteredPosts.map((post) => {
            const project = projectById.get(post.project_id);
            const image = getPostImage(post.primary_image_url, project);
            const statusClass = post.status === "published" ? "is-live" : post.status === "failed" ? "is-missing" : "is-draft";
            return (
              <article key={post.id} className="admin-project-card">
                <div className="admin-card-media">
                  <Image src={image} alt="" width={640} height={420} />
                  <span className={`admin-status-pill ${statusClass}`}>{statusLabel(post.status)}</span>
                </div>
                <div className="admin-project-card__body">
                  <div>
                    <p className="admin-kicker">{post.service_slug ?? project?.service_slug ?? "service"}</p>
                    <h3>{post.title ?? "Untitled geo-post"}</h3>
                    <p className="admin-muted">{project?.address_private ?? "Address context unknown"}</p>
                  </div>
                  <p>{post.summary ?? project?.summary ?? "No summary saved."}</p>
                  <div className="admin-meta-grid">
                    <span><strong>Project:</strong> {project?.title ?? post.project_id}</span>
                    <span><strong>Published:</strong> {post.published_at ? new Date(post.published_at).toLocaleString("en-CA") : "Not published"}</span>
                    <span><strong>GBP response:</strong> {post.gbp_response ? "available" : "none"}</span>
                    <span><strong>Image:</strong> {post.primary_image_url ? "geo-post primary" : project?.photos?.[0] ? "project photo" : "placeholder"}</span>
                  </div>
                </div>
                <div className="admin-action-row">
                  <Link href={`/admin/geo-posts/${post.id}`} className="button">Open geo-post detail</Link>
                  <Link href={`/admin/projects/${post.project_id}/edit`} className="button button--ghost">Open project</Link>
                  {post.status !== "published" ? (
                    <form method="POST" action={`/admin/geo-posts/${post.id}/publish`}>
                      <button className="button" type="submit">Publish now</button>
                    </form>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="admin-empty-state">No geo-posts match the current filter.</div>
      )}
    </section>
  );
}
