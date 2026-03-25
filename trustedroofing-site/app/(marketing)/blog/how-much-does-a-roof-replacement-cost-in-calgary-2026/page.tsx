import Link from "next/link";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import { buildMetadata, canonicalUrl } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "How Much Does a Roof Replacement Cost in Calgary in 2026?",
  description: "Real 2026 roof replacement cost ranges in Calgary, what actually changes the price, and how to compare quotes properly.",
  path: "/blog/how-much-does-a-roof-replacement-cost-in-calgary-2026"
});

function buildBlogSchema() {
  const url = canonicalUrl("/blog/how-much-does-a-roof-replacement-cost-in-calgary-2026");

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: "How Much Does a Roof Replacement Cost in Calgary in 2026?",
    description: "Real roof replacement pricing ranges in Calgary and the factors that drive quote differences.",
    datePublished: "2026-03-25",
    dateModified: "2026-03-25",
    author: {
      "@type": "Organization",
      name: "Trusted Roofing & Exteriors"
    },
    publisher: {
      "@type": "Organization",
      name: "Trusted Roofing & Exteriors"
    },
    mainEntityOfPage: url,
    url,
    image: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=80&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80&fit=crop&crop=top",
      "https://images.unsplash.com/photo-1516156008625-3a9d6067fab5?w=1400&q=80&fit=crop"
    ]
  };
}

export default function RoofCostBlogPost() {
  const schema = buildBlogSchema();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <PageHero
        eyebrow="Calgary · 2026 cost guide"
        title="How Much Does a Roof Replacement Cost in Calgary in 2026?"
        description="Real ranges from real Calgary projects, not numbers pulled from a generic online estimator."
        actions={
          <>
            <Link href="/quote" className="button">Get instant quote</Link>
            <Link href="/services/roofing" className="button button--ghost">Roofing services</Link>
          </>
        }
      />

      <section className="ui-page-section">
        <PageContainer>
          <img
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=80&fit=crop&crop=center"
            alt="Roofers installing shingles on a residential home"
            className="blog-feature-image"
            loading="eager"
          />
          <p className="blog-caption">Photo via Unsplash (free for commercial use).</p>

          <div className="ui-detail-grid" style={{ marginTop: 20 }}>
            <article className="ui-card">
              <p>
                If you are pricing out a roof in Calgary right now, you have probably already seen it. One quote comes in
                at $7,000. Another shows up at $18,000. Same size house, completely different numbers, and nobody explains why.
              </p>
              <p>
                After doing this for a long time, most of that gap comes down to a few things that actually matter, and a
                lot that does not.
              </p>
            </article>
            <article className="ui-card">
              <h2>Typical roof replacement cost in Calgary (2026)</h2>
              <ul>
                <li>Small homes (1,000 to 1,500 sq ft): $6,500 to $9,500</li>
                <li>Mid-size homes (1,500 to 2,500 sq ft): $8,500 to $14,000</li>
                <li>Larger homes (2,500+ sq ft): $12,000 to $20,000+</li>
              </ul>
              <p>
                If you want a real number based on your actual house, use the
                {" "}<Link href="/quote">instant roof quote tool</Link>.
              </p>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section ui-page-section--soft">
        <PageContainer>
          <img
            src="https://images.unsplash.com/photo-1516156008625-3a9d6067fab5?w=1400&q=80&fit=crop"
            alt="Close-up of asphalt roof shingles texture"
            className="blog-feature-image"
            loading="lazy"
          />
          <p className="blog-caption">Photo via Unsplash (free for commercial use).</p>

          <article className="ui-card" style={{ marginTop: 20 }}>
            <h2>What actually changes the price</h2>
            <h3>Roof pitch and walkability</h3>
            <p>Low-slope roofs are faster and safer. Steep roofs slow everything down and labour cost rises quickly.</p>
            <h3>Roof complexity</h3>
            <p>Valleys, dormers, skylights, and tie-ins can add thousands even when square footage stays the same.</p>
            <h3>Material choice</h3>
            <ul>
              <li>GAF Timberline: common and usually lowest cost</li>
              <li>Malarkey: better impact resistance</li>
              <li>Euroshield: higher upfront cost, hail-focused, longer lifespan</li>
            </ul>
            <h3>Tear-off vs overlay</h3>
            <p>
              Most proper jobs in Calgary are full tear-offs with deck check and new underlayment. Cheap quotes often skip
              steps that create problems later.
            </p>
            <h3>Ventilation and attic conditions</h3>
            <p>Poor ventilation increases moisture, ice damming, and shortens roof life.</p>
            <h3>Access and setup</h3>
            <p>Tight access and bin placement constraints can add labour time in older Calgary neighborhoods.</p>
          </article>
        </PageContainer>
      </section>

      <section className="ui-page-section">
        <PageContainer>
          <img
            src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80&fit=crop&crop=top"
            alt="Steep residential roof showing pitch angle"
            className="blog-feature-image"
            loading="lazy"
          />
          <p className="blog-caption">Photo via Unsplash (free for commercial use).</p>

          <div className="ui-detail-grid" style={{ marginTop: 20 }}>
            <article className="ui-card">
              <h2>Calgary-specific factors that affect pricing</h2>
              <ul>
                <li>Hail exposure</li>
                <li>Chinook melt and refreeze cycles</li>
                <li>Temperature swings during install season</li>
                <li>Winter conditions that slow production</li>
              </ul>
              <p>Pricing from other cities rarely translates cleanly to Calgary jobs.</p>
            </article>

            <article className="ui-card">
              <h2>What a good quote should include</h2>
              <ul>
                <li>Full tear-off</li>
                <li>Ice and water membrane in valleys and edges</li>
                <li>Ventilation checked or corrected</li>
                <li>Proper flashing around walls and penetrations</li>
                <li>Cleanup and disposal included</li>
              </ul>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section ui-page-section--soft">
        <PageContainer>
          <article className="ui-card">
            <h2>So what should you expect to pay in 2026?</h2>
            <ul>
              <li>Basic asphalt roof: about $8,000 to $12,000</li>
              <li>Upgraded impact-resistant roof: about $10,000 to $16,000</li>
              <li>Premium systems like Euroshield: $15,000+</li>
            </ul>
            <p>
              If a number is way below that range, there is usually a reason. If it is above, you should get a clear
              breakdown of why.
            </p>
            <p>
              For deeper scope details, see our
              {" "}<Link href="/services/roofing">roof replacement services in Calgary</Link>
              {" "}page and review
              {" "}<Link href="/projects">Calgary roofing project examples</Link>
              {" "}to compare real outcomes.
            </p>
          </article>
        </PageContainer>
      </section>

      <CtaBand
        title="Want a real number based on your house?"
        body="Use the instant quote tool to get a practical range you can actually plan around."
      />
    </>
  );
}
