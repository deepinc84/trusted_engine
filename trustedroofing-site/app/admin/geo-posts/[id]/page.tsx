import Link from "next/link";
import { listAdminGeoPosts, getProjectById, listServices } from "@/lib/db";
import AdminTabs from "@/app/admin/_components/AdminTabs";

export default async function GeoPostDetailPage({ params }: { params: { id: string } }) {
  const posts = await listAdminGeoPosts(500);
  const post = posts.find((item) => item.id === params.id);
  if (!post) {
    return <section className="section"><p>Geo-post not found.</p></section>;
  }

  const project = await getProjectById(post.project_id);
  const services = await listServices();
  const serviceOptions = [
    ...services.map((service) => ({ slug: service.slug, title: service.title })),
    { slug: "james-hardie-siding", title: "James Hardie siding" }
  ].filter((item, index, arr) => arr.findIndex((candidate) => candidate.slug === item.slug) === index);
  const projectUrl = project?.slug ? `/projects/${project.slug}` : "";
  const defaultAnchorText = project?.title ? `See the full ${project.title} project` : "View the related project";
  const projectPhotoOptions = (project?.photos ?? []).map((photo) => photo.public_url);
  const currentImageInProjectSet = post.primary_image_url && !projectPhotoOptions.includes(post.primary_image_url)
    ? [post.primary_image_url]
    : [];
  const imageOptions = [...currentImageInProjectSet, ...projectPhotoOptions];

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
          Service category
          <select className="input" name="service_slug" defaultValue={post.service_slug ?? project?.service_slug ?? ""}>
            <option value="">Select service category</option>
            {serviceOptions.map((service) => (
              <option key={service.slug} value={service.slug}>{service.title}</option>
            ))}
          </select>
        </label>
        <fieldset style={{ border: "1px solid #d7dce5", borderRadius: 10, padding: 12 }}>
          <legend>Post image</legend>
          <label style={{ display: "block", marginBottom: 8 }}>
            <input type="radio" name="primary_image_url" value="" defaultChecked={!post.primary_image_url} /> Use project primary image
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
            {imageOptions.map((url, index) => (
              <label key={`${url}-${index}`} style={{ border: "1px solid #d7dce5", borderRadius: 8, padding: 8, display: "grid", gap: 6 }}>
                <input type="radio" name="primary_image_url" value={url} defaultChecked={post.primary_image_url === url} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Geo-post image option ${index + 1}`} style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 6 }} />
              </label>
            ))}
          </div>
        </fieldset>
        <label>
          Content
          <textarea className="input input--multiline" rows={10} name="content" defaultValue={post.content ?? ""} />
        </label>
        <label>
          Link anchor text
          <input className="input" name="project_link_anchor_text" placeholder={defaultAnchorText} />
        </label>
        <label>
          Link target
          <input className="input" name="project_link_href" defaultValue={projectUrl} placeholder="/projects/your-project-slug" />
        </label>
        <button className="button" type="submit">Save geo-post</button>
      </form>
      <form method="POST" action={`/admin/geo-posts/${post.id}/publish`} style={{ marginTop: 10 }}>
        <button className="button" type="submit">Publish now</button>
      </form>
    </section>
  );
}
