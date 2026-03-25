import Link from "next/link";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Blog",
  description: "Roofing and exterior guides for Calgary homeowners.",
  path: "/blog"
});

const posts = [
  {
    slug: "how-much-does-a-roof-replacement-cost-in-calgary-2026",
    title: "How Much Does a Roof Replacement Cost in Calgary in 2026?",
    excerpt: "Real 2026 Calgary pricing ranges, what drives quote gaps, and what a proper roof quote should include.",
    date: "2026-03-25"
  }
];

export default function BlogIndexPage() {
  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Practical roofing guides for Calgary homeowners"
        description="Clear, plain-language answers on pricing, scope, and material decisions based on real project experience."
      />

      <section className="ui-page-section">
        <PageContainer>
          <div className="ui-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            {posts.map((post) => (
              <article key={post.slug} className="ui-card">
                <p className="ui-pill">{new Date(post.date).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}</p>
                <h2>{post.title}</h2>
                <p className="homev3-copy">{post.excerpt}</p>
                <Link href={`/blog/${post.slug}`}>Read article</Link>
              </article>
            ))}
          </div>
        </PageContainer>
      </section>
    </>
  );
}
