import Image from "next/image";
import Link from "next/link";
import { listAdminGeoPosts, listAdminInstantQuotes, listProjects } from "@/lib/db";
import AdminTabs from "@/app/admin/_components/AdminTabs";
import { getPlaceholderProjectImage } from "@/lib/images";

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("en-CA") : "No completion date";
}

export default async function AdminDashboardPage() {
  const [projects, geoPosts, instantQuotes] = await Promise.all([
    listProjects({ include_unpublished: true, limit: 100 }),
    listAdminGeoPosts(500),
    listAdminInstantQuotes({ status: "all", limit: 500 })
  ]);

  const geoPostByProjectId = new Map(geoPosts.map((post) => [post.project_id, post]));
  const publishedGeoPosts = geoPosts.filter((post) => post.status === "published").length;
  const draftGeoPosts = geoPosts.filter((post) => post.status !== "published").length;
  const projectsMissingGeoPosts = projects.filter((project) => !geoPostByProjectId.has(project.id)).length;
  const quoteLeads = instantQuotes.filter((quote) => quote.has_contact_submission || quote.project_id).length;

  return (
    <section className="section admin-shell">
      <div className="admin-hero">
        <div>
          <p className="admin-kicker">Control centre</p>
          <h1 className="hero-title">GeoBoost Admin</h1>
          <p className="hero-subtitle">
            Manage project pages, see exactly which projects have geo-posts, publish status at a glance, and review instant quote activity.
          </p>
        </div>
        <div className="admin-hero__actions">
          <Link href="/admin/projects/new" className="button">Create project</Link>
          <Link href="/admin/geo-posts" className="button button--ghost">Manage geo-posts</Link>
          <Link href="/admin/instant-quotes" className="button button--ghost">Review instant quotes</Link>
        </div>
      </div>

      <AdminTabs currentPath="/admin" />

      <div className="admin-stat-grid" aria-label="Admin status summary">
        <div className="admin-stat-card admin-stat-card--success">
          <span>Published geo-posts</span>
          <strong>{publishedGeoPosts}</strong>
          <Link href="/admin/geo-posts?status=published">View live posts</Link>
        </div>
        <div className="admin-stat-card admin-stat-card--warning">
          <span>Draft / queued geo-posts</span>
          <strong>{draftGeoPosts}</strong>
          <Link href="/admin/geo-posts?status=draft">Finish drafts</Link>
        </div>
        <div className="admin-stat-card admin-stat-card--danger">
          <span>Projects missing geo-posts</span>
          <strong>{projectsMissingGeoPosts}</strong>
          <Link href="/admin/geo-posts#needs-geo-post">Create missing drafts</Link>
        </div>
        <div className="admin-stat-card">
          <span>Instant quote leads</span>
          <strong>{quoteLeads}</strong>
          <Link href="/admin/instant-quotes">Open dashboard</Link>
        </div>
      </div>

      <div className="admin-section-heading">
        <div>
          <p className="admin-kicker">Projects</p>
          <h2 className="homev3-title">Project + geo-post status</h2>
        </div>
        <p>Every card shows whether the project has a geo-post, whether it is live, and what action is needed next.</p>
      </div>

      <div className="admin-project-grid">
        {projects.map((project) => {
          const geoPost = geoPostByProjectId.get(project.id);
          const image = project.photos?.[0]?.public_url ?? getPlaceholderProjectImage({
            seed: project.slug,
            neighborhood: project.neighborhood,
            quadrant: project.quadrant,
            city: project.city
          });
          const status = geoPost?.status ?? "missing";
          const statusClass = status === "published" ? "is-live" : status === "missing" ? "is-missing" : "is-draft";

          return (
            <article key={project.id} className="admin-project-card">
              <div className="admin-card-media">
                <Image src={image} alt="" width={640} height={420} />
                <span className={`admin-status-pill ${statusClass}`}>{status === "published" ? "Geo-post live" : status === "missing" ? "No geo-post" : `Geo-post ${status}`}</span>
              </div>
              <div className="admin-project-card__body">
                <div>
                  <p className="admin-kicker">{project.service_slug} · {formatDate(project.completed_at)}</p>
                  <h3>{project.title}</h3>
                  <p className="admin-muted">{project.neighborhood ?? project.city}, {project.city}</p>
                </div>
                <p>{project.summary}</p>
                <div className="admin-meta-grid">
                  <span><strong>Project:</strong> {project.is_published ? "Published" : "Draft/private"}</span>
                  <span><strong>Geo-post:</strong> {geoPost ? `${geoPost.status}${geoPost.published_at ? ` on ${new Date(geoPost.published_at).toLocaleDateString("en-CA")}` : ""}` : "Not created"}</span>
                </div>
              </div>
              <div className="admin-action-row">
                <Link href={`/admin/projects/${project.id}/edit`} className="button button--ghost">Edit project</Link>
                {geoPost ? (
                  <Link href={`/admin/geo-posts/${geoPost.id}`} className="button">Open geo-post</Link>
                ) : (
                  <form method="POST" action={`/admin/projects/${project.id}/geo-post`}>
                    <button className="button" type="submit">Create geo-post draft</button>
                  </form>
                )}
                <Link href={`/projects/${project.slug}`} className="button button--ghost">View public page</Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
