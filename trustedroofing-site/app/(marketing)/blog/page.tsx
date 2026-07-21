import Link from "next/link";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import { getPublishedBlogPosts } from "@/lib/blog";
import { buildMetadata } from "@/lib/seo";

import BreadcrumbSchema from "@/components/BreadcrumbSchema";
export const metadata = buildMetadata({
  title: "Blog",
  description: "Calgary roofing and exterior guides with cost context, scope planning, and local project insights for homeowners.",
  path: "/blog"
});

export const dynamic = "force-dynamic";



export default function BlogIndexPage() {
  const posts = getPublishedBlogPosts();

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "" },
          { name: "Blog", path: "/blog" }
        ]}
      />
      <PageHero
        eyebrow="Blog"
        title="Practical roofing guides for Calgary homeowners"
        description="Clear, plain-language answers on pricing, scope, and material decisions based on real project experience."
      />

      <section className="ui-page-section">
        <PageContainer>
          <div className="ui-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            {posts.map((post) => (
              <article key={post.slug} className="ui-card">
                <img
                  src={post.image}
                  alt={post.title}
                  loading="lazy"
                  style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 10 }}
                />
                <p className="ui-pill">{new Date(post.publishAt).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}</p>
                <h2>
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="homev3-copy">{post.excerpt}</p>
              </article>
            ))}
          </div>
        </PageContainer>
      </section>
    </>
  );
}
