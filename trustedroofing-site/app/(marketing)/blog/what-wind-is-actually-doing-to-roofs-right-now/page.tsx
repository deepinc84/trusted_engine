import Link from "next/link";
import { buildMetadata, canonicalUrl } from "@/lib/seo";
import styles from "../how-much-does-a-roof-replacement-cost-in-calgary-2026/page.module.css";

export const metadata = buildMetadata({
  title: "What Wind Is Actually Doing to Roofs Right Now",
  description:
    "A Calgary storm-damage field update on roofing, siding, soffit, gutters, and flashing weak points homeowners should inspect now.",
  path: "/blog/what-wind-is-actually-doing-to-roofs-right-now"
});

function buildBlogSchema() {
  const url = canonicalUrl("/blog/what-wind-is-actually-doing-to-roofs-right-now");

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: "What Wind Is Actually Doing to Roofs Right Now",
    description:
      "A practical look at the wind damage we are seeing this week across Calgary roofs, siding, soffit, gutters, and roof penetrations.",
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
      "/missing-soffit-calgary-wind-storm.JPG",
      "/gutter-wind-damage-fallen-tree.jpg",
      "/vinyl-siding-wind-damage-calgary.JPG",
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
          <h1 className={styles.title}>What Wind Is Actually Doing to Roofs Right Now</h1>
          <p className={styles.copy} style={{ marginTop: 12, maxWidth: 680 }}>
            Wind doesn&apos;t need to rip an entire roof apart to cause expensive failures. Here&apos;s what we&apos;re seeing this week,
            why it matters, and what homeowners should check before the next storm.
          </p>
          <div className={styles.heroActions}>
            <Link href="/online-estimate" className="button">Use the instant quote tool →</Link>
            <Link href="/services/roofing" className="button button--ghost">Roofing services</Link>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.heroImageWrap}>
            <img
              src="/calgary-wind-damage-roof.jpeg"
              alt="Large section of shingles missing after a Calgary wind event"
              className={styles.heroImage}
              loading="eager"
            />
            <p className={styles.imgCap}>Field photo: major shingle blow-off exposing roof system layers.</p>
          </div>

          <div className={styles.detailGrid} style={{ alignItems: "start" }}>
            <article className="ui-card">
              <h2>Roof Damage Starts Before Shingles Go Missing</h2>
              <p>In most cases, wind damage starts quietly and escalates:</p>
              <h3>What wind is doing first</h3>
              <ul>
                <li>Lifting shingles and breaking their seal.</li>
                <li>Creasing tabs so they fail later.</li>
                <li>Exposing underlayment and nail lines.</li>
              </ul>
              <p>
                Once the seal is broken, the roof is vulnerable even when it still looks fine from the ground. If you&apos;re seeing
                anything similar, it&apos;s time to plan <Link href="/services/roofing">roof repair in Calgary</Link> before the
                next wind cycle opens it up further.
              </p>
            </article>

            <article className="ui-card">
              <h2>The Damage You Don&apos;t See Yet</h2>
              <img
                className={styles.inlineImage}
                src="/missing-shingle-wind-damage.jpeg"
                alt="Wind-lifted and missing shingles exposing underlayment and decking"
                loading="lazy"
              />
              <p className={styles.imgCap}>Wind-lifted section at the stage right before broader failure.</p>
              <h3>Hidden failure signs</h3>
              <ul>
                <li>Lifted tabs.</li>
                <li>Broken adhesive seals.</li>
                <li>Weakened sections that have not blown off yet.</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionSoft}`}>
        <div className={styles.shell}>
          <div className={styles.detailGrid} style={{ alignItems: "start" }}>
            <article className="ui-card">
              <h2>Siding Damage: Vinyl vs. Hardie</h2>
              <img
                className={styles.inlineImage}
                src="/vinyl-siding-wind-damage-calgary.JPG"
                alt="Wind-damaged vinyl soffit and siding on a Calgary home"
                loading="lazy"
              />
              <h3>Vinyl siding in heavy wind</h3>
              <ul>
                <li>Loosens under pressure.</li>
                <li>Pulls apart at seams.</li>
                <li>Can crack in colder temperatures.</li>
              </ul>
              <h3>James Hardie in sustained wind</h3>
              <ul>
                <li>More rigid and impact resistant.</li>
                <li>Less movement at seams.</li>
                <li>Typically performs better in Alberta conditions.</li>
              </ul>
              <p>
                If you&apos;re dealing with storm damage now or planning upgrades, this falls under
                <Link href="/services/siding"> siding installation in Calgary</Link>.
              </p>
            </article>

            <article className="ui-card">
              <h2>Soffit Failure and Pressure Damage</h2>
              <img
                className={styles.inlineImage}
                src="/missing-soffit-calgary-wind-storm.JPG"
                alt="Missing soffit panel exposing attic cavity after wind storm"
                loading="lazy"
              />
              <p>Wind doesn&apos;t only hit the roof surface - it gets underneath it.</p>
              <h3>Why soffits fail</h3>
              <ul>
                <li>Pressure builds in the roof system.</li>
                <li>Panels were under-secured.</li>
                <li>Wind finds an existing weak point.</li>
              </ul>
              <h3>Why quick action matters</h3>
              <ul>
                <li>Moisture can enter attic spaces.</li>
                <li>Ventilation balance is disrupted.</li>
                <li>Pests gain direct access points.</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.detailGrid} style={{ alignItems: "start" }}>
            <article className="ui-card">
              <h2>Wind-Driven Debris and Gutter Damage</h2>
              <img
                className={styles.inlineImage}
                src="/gutter-wind-damage-fallen-tree.jpg"
                alt="Damaged eavestrough from wind-driven impact"
                loading="lazy"
              />
              <p>
                Not all damage is from wind pressure alone. Debris and branches are striking roof edges and deforming
                eavestrough systems.
              </p>
              <h3>Common causes we are seeing</h3>
              <ul>
                <li>Branches striking gutter edges.</li>
                <li>Debris dragged across rooflines.</li>
                <li>Repeated movement during sustained gusts.</li>
              </ul>
              <p>
                If your roofline looks off, it&apos;s worth handling <Link href="/services/eavestrough">eavestrough repair in Calgary</Link>
                before water starts backing into fascia and soffit zones.
              </p>
            </article>

            <article className="ui-card">
              <h2>Flashing and Penetration Weak Points</h2>
              <img
                className={styles.inlineImage}
                src="/fascia-blown-off-wind-storm-calgary.JPG"
                alt="Exposed roof edge and membrane after wind-related trim and flashing failure"
                loading="lazy"
              />
              <p>Penetrations and edge transitions remain some of the highest-risk leak points after wind events.</p>
              <h3>What this means for homeowners right now</h3>
              <ul>
                <li>Visible damage is usually the late stage, not the first stage.</li>
                <li>Waiting for an interior leak usually means bigger scope and higher cost.</li>
                <li>Post-storm inspections catch repairs while they are still small.</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionSoft}`}>
        <div className={styles.shell}>
          <article className="ui-card">
            <h2>How to Reduce Wind Damage Going Forward</h2>
            <p>You can&apos;t stop wind, but you can reduce how much damage it causes over time.</p>
            <h3>What actually helps</h3>
            <ul>
              <li>Proper shingle fastening and pattern installation.</li>
              <li>Reinforced ridge and edge systems.</li>
              <li>Better siding material selection.</li>
              <li>Secure soffit and fascia installation.</li>
              <li>Routine inspections after major storms.</li>
            </ul>
            <h4>Not sure what condition your roof is in?</h4>
            <p>
              After a week like this, many homeowners aren&apos;t sure whether damage is minor or urgent. Use the
              <Link href="/online-estimate"> instant quote tool</Link> to get a rough cost range, then decide whether to
              schedule immediate repair or monitor the system.
            </p>
            <h5>Local expertise matters</h5>
            <p>
              This is where working with a <Link href="/services/roofing">roofing contractor in Calgary</Link> who understands
              local wind patterns and installation standards makes a measurable difference.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
