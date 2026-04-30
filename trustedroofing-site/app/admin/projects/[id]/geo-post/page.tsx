import Link from "next/link";
import { getProjectById } from "@/lib/db";
import AdminTabs from "@/app/admin/_components/AdminTabs";

export default async function CreateGeoPostPage({ params }: { params: { id: string } }) {
  const project = await getProjectById(params.id);
  if (!project) {
    return <section className="section"><p>Project not found.</p></section>;
  }

  const defaultContent = project.summary?.trim() || project.description?.trim() || "";

  return (
    <section className="section" style={{ maxWidth: 960 }}>
      <h1 className="hero-title">Create geo-post draft</h1>
      <AdminTabs currentPath="/admin/geo-posts" />
      <p><Link href="/admin/geo-posts">← Back to geo-post management</Link></p>
      <p>Project: <strong>{project.title}</strong></p>

      <form method="POST" action={`/admin/projects/${project.id}/geo-post`} style={{ display: "grid", gap: 12 }}>
        <input type="hidden" name="from_creation_flow" value="1" />
        <label>
          Geo-post content
          <textarea className="input input--multiline" name="content" rows={12} defaultValue={defaultContent} />
        </label>

        <fieldset style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
          <legend>Post image</legend>
          <p style={{ marginTop: 0 }}>Pick one project photo for this geo-post.</p>
          <div style={{ display: "grid", gap: 10 }}>
            {(project.photos ?? []).map((photo) => (
              <label key={photo.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="radio"
                  name="primary_image_url"
                  value={photo.public_url}
                  defaultChecked={Boolean(photo.is_primary)}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.public_url} alt="" style={{ width: 96, height: 72, objectFit: "cover", borderRadius: 6 }} />
                <span>{photo.caption || photo.file_name || "Project photo"}{photo.is_primary ? " (current primary)" : ""}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <button className="button" type="submit">Create geo-post draft</button>
      </form>
    </section>
  );
}
