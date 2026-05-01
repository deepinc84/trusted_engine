import Link from "next/link";
import { buildMetadata, canonicalUrl } from "@/lib/seo";
import styles from "../how-much-does-a-roof-replacement-cost-in-calgary-2026/page.module.css";

export const metadata = buildMetadata({
  title: "Calgary Wind Damage This Week | Trusted Roofing & Exteriors",
  description:
    "Strong Calgary winds are exposing roof, siding, soffit, fascia, and gutter damage. See what is failing and what homeowners should check after a wind event.",
  path: "/blog/what-wind-is-actually-doing-to-roofs-right-now"
});

function buildBlogSchema() {
  const url = canonicalUrl("/blog/what-wind-is-actually-doing-to-roofs-right-now");

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: "Calgary Wind Damage This Week, What We're Actually Seeing",
    description:
      "Strong Calgary winds are exposing roof, siding, soffit, fascia, and gutter damage. See what is failing and what homeowners should check after a wind event.",
    datePublished: "2026-04-30",
    dateModified: "2026-04-30",
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
      "/calgary-wind-damage-roof.jpeg",
      "/missing-shingle-wind-damage.jpeg",
      "/vinyl-siding-wind-damage-calgary.JPG",
      "/missing-soffit-calgary-wind-storm.JPG",
      "/gutter-wind-damage-fallen-tree.jpg",
      "/fascia-blown-off-wind-storm-calgary.JPG"
    ]
  };
}

export default function WindDamageBlogPost() {
  const schema = buildBlogSchema();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className={styles.hero}>
        <div className={styles.shell}>
          <p className={styles.eyebrow}>Calgary · Storm Damage Update</p>
          <h1 className={styles.title}>Calgary Wind Damage This Week, What We're Actually Seeing</h1>
          <p className={styles.copy} style={{ marginTop: 12, maxWidth: 700 }}>
            Over the past week, strong winds across Calgary and surrounding areas have caused a sharp increase in exterior
            damage. This is not isolated. It is showing up across multiple properties, and a lot of the damage is not
            visible from the ground.
          </p>
          <div className={styles.heroActions}>
            <Link href="/online-estimate" className="button">Use the instant quote tool →</Link>
            <Link href="/services/roof-repair" className="button button--ghost">Roof repair services</Link>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.heroImageWrap}>
            <img
              src="/calgary-wind-damage-roof.jpeg"
              alt="Calgary roof with major wind blow-off exposing lower roof layers"
              className={styles.heroImage}
              loading="eager"
            />
            <p className={styles.imgCap}>This is late-stage failure. Shingles are gone and the system is already open.</p>
          </div>

          <div className={styles.detailGrid} style={{ alignItems: "start" }}>
            <article className="ui-card">
              <p className={styles.eyebrow} style={{ marginBottom: 10 }}>Field notes</p>
              <h2>What Failed First</h2>
              <p>These are the first failure patterns we are seeing on site:</p>
              <ul>
                <li>Shingles lifted and adhesive seals broken.</li>
                <li>Tabs creased but still in place.</li>
                <li>Nail lines and underlayment exposed at edges.</li>
                <li>Localized areas opening up before full blow-off.</li>
              </ul>
              <p>
                If this is showing on your roof, do not wait for interior leaks. Book
                <Link href="/services/roof-repair"> roof repair services</Link> while scope is still controlled.
              </p>
            </article>

            <article className="ui-card">
              <p className={styles.eyebrow} style={{ marginBottom: 10 }}>Visual proof</p>
              <div className={styles.proofStrip}>
                <div className={styles.proofItem}>
                  <span className={styles.proofValue}>1</span>
                  <p className={styles.proofLabel}>Lifted tabs</p>
                </div>
                <div className={styles.proofItem}>
                  <span className={styles.proofValue}>2</span>
                  <p className={styles.proofLabel}>Broken seals</p>
                </div>
                <div className={styles.proofItem}>
                  <span className={styles.proofValue}>3</span>
                  <p className={styles.proofLabel}>System exposure</p>
                </div>
              </div>
              <p>Most roofs in this stage look fine from the street. They are not fine up close.</p>
              <Link href="/online-estimate" className="button" style={{ justifyContent: "center" }}>Get a fast starting range →</Link>
            </article>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionSoft}`}>
        <div className={styles.shell}>
          <div className={styles.detailGrid} style={{ alignItems: "start" }}>
            <article className="ui-card">
              <h2>Why Missing Shingles Are the Late-Stage Sign</h2>
              <p>
                Missing shingles are usually the result, not the first event. First comes lift, then seal failure, then tab
                crease, then blow-off in the next wind cycle.
              </p>
              <h3>What this means right now</h3>
              <ul>
                <li>No missing shingle does not mean no damage.</li>
                <li>Lifted sections become failure zones quickly.</li>
                <li>Small repair windows close fast in repeated wind.</li>
              </ul>
            </article>

            <div style={{ display: "grid", gap: 16 }}>
              <img className={styles.inlineImage} src="/missing-shingle-wind-damage.jpeg" alt="Wind-lifted shingles with exposed roof area" loading="lazy" />
              <p className={styles.imgCap}>This roof is in transition from hidden damage to active failure.</p>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.shell} style={{ paddingBottom: 0 }}>
        <div style={{ borderRadius: "var(--r-lg)", overflow: "hidden", border: "1px solid var(--border-light)" }}>
          <img src="/missing-soffit-calgary-wind-storm.JPG" alt="Missing soffit panel exposing attic space after wind pressure failure" loading="lazy" className={styles.bandImage} />
        </div>
      </div>

      <section className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.detailGrid} style={{ alignItems: "start" }}>
            <article className="ui-card">
              <h2>Soffit and Pressure Damage</h2>
              <p>
                Wind does not only push on roof surfaces. It also creates pressure under edges and overhangs. That is why
                soffit sections are blowing out.
              </p>
              <h3>After soffit failure, risk jumps</h3>
              <ul>
                <li>Attic space is directly exposed.</li>
                <li>Ventilation balance is disrupted.</li>
                <li>Moisture entry risk rises during the next weather event.</li>
              </ul>
              <p>
                This is a roof-system issue and an exterior issue. It often involves
                <Link href="/services/soffit-fascia"> soffit and fascia repair</Link> plus roof edge corrections.
              </p>
            </article>

            <article className="ui-card">
              <h2>Siding Damage: Vinyl vs Hardie</h2>
              <img className={styles.inlineImage} src="/vinyl-siding-wind-damage-calgary.JPG" alt="Wind-related movement and damage at vinyl siding and soffit area" loading="lazy" />
              <h3>Vinyl in sustained wind</h3>
              <ul>
                <li>More movement at seams and lock points.</li>
                <li>Higher chance of sections pulling loose.</li>
                <li>More stress at corners and transitions.</li>
              </ul>
              <h3>James Hardie in sustained wind</h3>
              <ul>
                <li>More rigid at seams and fasteners.</li>
                <li>Performs more consistently in repeated wind cycles.</li>
              </ul>
              <p>
                Compare options at <Link href="/services/siding">siding services</Link> or review
                <Link href="/services/james-hardie-siding"> James Hardie siding</Link> if durability is the goal.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionSoft}`}>
        <div className={styles.shell}>
          <div className={styles.detailGrid} style={{ alignItems: "start" }}>
            <article className="ui-card">
              <h2>Gutter and Debris Impact Damage</h2>
              <img className={styles.inlineImage} src="/gutter-wind-damage-fallen-tree.jpg" alt="Gutter deformation from wind-driven debris and branch contact" loading="lazy" />
              <p>
                We are seeing gutter deformation from wind-driven debris, branch impact, and tree contact at roof edges.
                Once the profile bends, drainage performance drops and water starts loading fascia and soffit lines.
              </p>
              <p>
                If your roof edge looks uneven, check <Link href="/services/gutters">gutter services</Link> before runoff backs
                into adjacent components.
              </p>
            </article>

            <article className="ui-card">
              <h2>Edge, Fascia, and Flashing Weak Points</h2>
              <img className={styles.inlineImage} src="/fascia-blown-off-wind-storm-calgary.JPG" alt="Roof edge and fascia trim displaced by wind exposing vulnerable transition" loading="lazy" />
              <p>
                Edges, penetrations, and roof-to-wall transitions take the highest stress. These areas fail first when
                fastening, sealing, or metal termination is weak.
              </p>
              <h3>What we check first on site</h3>
              <ul>
                <li>Edge metal and fascia termination.</li>
                <li>Penetration flashing continuity.</li>
                <li>Transition lines where wind can catch and lift.</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.shell}>
          <article className="ui-card" style={{ textAlign: "center", padding: "clamp(20px, 3vw, 34px)" }}>
            <p className={styles.eyebrow}>Next step</p>
            <h2 style={{ marginBottom: 8 }}>Already failed or starting to fail</h2>
            <p style={{ maxWidth: 760, margin: "0 auto 14px" }}>
              After wind events like this, homes usually fall into one of two categories: already failed, or starting to
              fail. Use the instant quote tool to get a starting range, then decide whether repair or inspection makes
              sense.
            </p>
            <div className={styles.heroActions} style={{ justifyContent: "center" }}>
              <Link href="/online-estimate" className="button">Use the instant quote tool</Link>
              <Link href="/services/roofing" className="button button--ghost">Roofing services</Link>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
