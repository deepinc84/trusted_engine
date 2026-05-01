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
    slug: "what-wind-is-actually-doing-to-roofs-right-now",
    title: "What Wind Is Actually Doing to Roofs Right Now",
    excerpt: "A field update on current Calgary wind damage patterns across shingles, siding, soffit, gutters, and flashing.",
    date: "2026-04-30",
    image: "/calgary-wind-damage-roof.jpeg"
  },
  {
    slug: "how-much-does-a-roof-replacement-cost-in-calgary-2026",
    title: "How Much Does a Roof Replacement Cost in Calgary in 2026?",
    excerpt: "Real 2026 Calgary pricing ranges, what drives quote gaps, and what a proper roof quote should include.",
    date: "2026-03-25",
    image: "/instant-quote.png"
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
          <div className="ui-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            {posts.map((post) => (
              <article key={post.slug} className="ui-card">
                <img
                  src={post.image}
                  alt={post.title}
                  loading="lazy"
                  style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 10 }}
                />
                <p className="ui-pill">{new Date(post.date).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}</p>
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
