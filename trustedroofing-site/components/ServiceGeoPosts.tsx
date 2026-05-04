import Image from "next/image";
import Link from "next/link";
import type { ResolvedGeoPost } from "@/lib/db";
import PageContainer from "@/components/ui/PageContainer";
import { getPlaceholderProjectImage } from "@/lib/images";

function projectLinkFromContent(content: string | null): { href: string; text: string } | null {
  if (!content) return null;
  const match = content.match(/\[([^\]]+)\]\(([^)]+)\)/);
  if (!match) return null;
  return { text: match[1].trim(), href: match[2].trim() };
}

export default function ServiceGeoPosts({ geoPosts }: { geoPosts: ResolvedGeoPost[] }) {
  if (geoPosts.length === 0) return null;

  const recent = geoPosts.slice(0, 5);
  const fullList = geoPosts.slice(0, 5);
  const fullPanels = [0, 1, 2].map((i) => fullList[i] ?? null);

  return (
    <>
      <section className="ui-page-section ui-page-section--soft">
        <PageContainer>
          <h2 className="homev3-title" style={{ marginBottom: 16 }}>Recent local project updates</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {recent.map((post, index) => {
              const title = post.title ?? post.slug ?? "Project update";
              const geoHref = post.slug ? `/geo-posts/${post.slug}` : "/projects";
              const heroImage = post.heroImage ?? getPlaceholderProjectImage({ seed: post.slug ?? post.id, neighborhood: post.neighborhood, city: post.city });
              return (
                <article key={post.id} className="ui-card" style={{ padding: 0, overflow: "hidden" }}>
                  <Link href={geoHref}>
                    <Image src={heroImage} alt={title} width={420} height={220} style={{ width: "100%", height: 130, objectFit: "cover" }} loading={index < 2 ? "eager" : "lazy"} />
                    <div style={{ padding: 10, display: "grid", gap: 6 }}>
                      <h3 style={{ margin: 0, fontSize: "1rem", lineHeight: 1.3 }}>{title}</h3>
                      <p style={{ margin: 0, fontSize: ".85rem" }}>{post.neighborhood ?? post.city ?? "Calgary"}, {post.province ?? "AB"}</p>
                      <span className="quote-card__cta">Read full post</span>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section">
        <PageContainer>
          <article className="ui-card">
            <h2>Full local post archive</h2>
            <p className="homev3-copy">Expanded geo-post text is provided below for indexing and location detail depth.</p>
            <div style={{ display: "grid", gap: 10 }}>
              {fullPanels.map((post, i) => (
                <details key={post?.id ?? `empty-${i}`}>
                  <summary style={{ cursor: "pointer", fontWeight: 700 }}>
                    {post ? (post.title ?? "Project update") : `Reserved project post slot ${i + 1}`}
                  </summary>
                  {post ? (() => {
                    const geoHref = post.slug ? `/geo-posts/${post.slug}` : "/projects";
                    const projectLink = projectLinkFromContent(post.content);
                    const cleanContent = (post.content ?? "").replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1").trim();
                    return (
                      <div style={{ paddingTop: 10, display: "grid", gap: 8 }}>
                        <p style={{ margin: 0 }}>{cleanContent || post.summary || "Published local project update."}</p>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                          <Link href={geoHref}>Open canonical geo-post</Link>
                          <Link href={projectLink?.href ?? "/projects"}>{projectLink?.text ?? "View related project"}</Link>
                        </div>
                      </div>
                    );
                  })() : <p style={{ marginTop: 8 }}>No additional post yet.</p>}
                </details>
              ))}
            </div>
          </article>
        </PageContainer>
      </section>
    </>
  );
}
