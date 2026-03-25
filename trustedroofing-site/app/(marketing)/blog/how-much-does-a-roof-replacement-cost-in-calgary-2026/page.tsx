import Link from "next/link";
import { buildMetadata, canonicalUrl } from "@/lib/seo";
import styles from "./page.module.css";

export const metadata = buildMetadata({
  title: "How Much Does a Roof Replacement Cost in Calgary in 2026?",
  description: "Real roof replacement pricing ranges in Calgary and what actually drives quote differences.",
  path: "/blog/how-much-does-a-roof-replacement-cost-in-calgary-2026"
});

function buildBlogSchema() {
  const url = canonicalUrl("/blog/how-much-does-a-roof-replacement-cost-in-calgary-2026");

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: "How Much Does a Roof Replacement Cost in Calgary in 2026?",
    description: "Real ranges from real Calgary projects, not numbers pulled from a generic online estimator.",
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
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80&fit=crop&crop=top",
      "https://images.unsplash.com/photo-1516156008625-3a9d6067fab5?w=1400&q=80&fit=crop",
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1400&q=80&fit=crop"
    ]
  };
}

export default function RoofCostBlogPost() {
  const schema = buildBlogSchema();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className={styles.hero}>
        <div className={styles.shell}>
          <p className={styles.eyebrow}>Calgary · 2026 Cost Guide</p>
          <h1 className={styles.title}>How Much Does a Roof Replacement Cost in Calgary in 2026?</h1>
          <p className={styles.copy} style={{ marginTop: 12, maxWidth: 620 }}>
            Real ranges from real Calgary projects - not numbers pulled from a generic online estimator.
          </p>
          <div className={styles.heroActions}>
            <Link href="/quote" className="button">Get instant quote →</Link>
            <Link href="/services/roofing" className="button button--ghost">Roofing services</Link>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.heroImageWrap}>
            <img
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=80&fit=crop&crop=center"
              alt="Roofers installing shingles on a residential Calgary home"
              className={styles.heroImage}
              loading="eager"
            />
            <p className={styles.imgCap}>
              Photo via <a href="https://unsplash.com/license" target="_blank" rel="noopener">Unsplash</a> · Free for commercial use
            </p>
          </div>

          <div className={styles.detailGrid} style={{ alignItems: "start" }}>
            <article className="ui-card">
              <p>If you&apos;re pricing out a roof in Calgary right now, you&apos;ve probably already seen it.</p>

              <div className={styles.quoteCallout}>
                <div className={styles.quoteCalloutItem}>
                  <span className={styles.quoteCalloutAmount}>$7,000</span>
                  <p className={styles.quoteCalloutLabel}>Quote A</p>
                </div>
                <div className={styles.quoteCalloutItem}>
                  <span className={styles.quoteCalloutAmount}>$18,000</span>
                  <p className={styles.quoteCalloutLabel}>Quote B</p>
                </div>
                <div className={styles.quoteCalloutVs}>Same size house. No explanation why.</div>
              </div>

              <p>
                After doing this for a long time, most of that gap comes down to a few things that actually matter - and a
                lot that doesn&apos;t. This guide breaks down what&apos;s really driving those numbers on Calgary roofs in 2026.
              </p>
            </article>

            <article className="ui-card">
              <p className={styles.eyebrow} style={{ marginBottom: 10 }}>Typical costs at a glance</p>
              <div className={styles.proofStrip}>
                <div className={styles.proofItem}>
                  <span className={styles.proofValue}>$6.5K+</span>
                  <p className={styles.proofLabel}>Small homes</p>
                </div>
                <div className={styles.proofItem}>
                  <span className={styles.proofValue}>$8.5K+</span>
                  <p className={styles.proofLabel}>Mid-size homes</p>
                </div>
                <div className={styles.proofItem}>
                  <span className={styles.proofValue}>$12K+</span>
                  <p className={styles.proofLabel}>Larger homes</p>
                </div>
              </div>
              <p>Standard asphalt shingles. Based on real Calgary projects - not generic online averages.</p>
              <Link href="/quote" className="button" style={{ justifyContent: "center" }}>Get your real number →</Link>
            </article>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionSoft}`}>
        <div className={styles.shell}>
          <article className="ui-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <h2>Typical Roof Replacement Cost in Calgary (2026)</h2>
              <span className="ui-pill">Real Calgary jobs</span>
            </div>
            <p>
              Here&apos;s what we&apos;re seeing across real jobs in Calgary right now. These ranges are for standard asphalt shingles -
              still what most homes here are running. Square footage is only part of the picture.
            </p>

            <div className={styles.tableWrap}>
              <table className={styles.costTable}>
                <thead>
                  <tr>
                    <th>Home Size</th>
                    <th>Square Footage</th>
                    <th>Typical Cost Range</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Small</strong></td>
                    <td>1,000 – 1,500 sq ft</td>
                    <td className={styles.price}>$6,500 – $9,500</td>
                  </tr>
                  <tr>
                    <td><strong>Mid-size</strong></td>
                    <td>1,500 – 2,500 sq ft</td>
                    <td className={styles.price}>$8,500 – $14,000</td>
                  </tr>
                  <tr>
                    <td><strong>Larger</strong></td>
                    <td>2,500+ sq ft</td>
                    <td className={styles.price}>$12,000 – $20,000+</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              I&apos;ve seen two houses side by side come in thousands apart just because one was walkable and the other wasn&apos;t.
              Use the <Link href="/quote">instant quote tool</Link> for a real number based on your actual house - it uses
              real Calgary project data, not formulas.
            </p>
          </article>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.detailGrid} style={{ alignItems: "start" }}>
            <article className="ui-card">
              <h2>What Actually Changes the Price</h2>

              <h3>Roof Pitch and Walkability</h3>
              <p>
                This is one of the biggest factors and it&apos;s almost never explained properly. On steep roofs, everything slows
                down - carrying bundles, setting lines, even just moving safely. That time turns directly into labour cost.
              </p>

              <div className={styles.pitchBars} style={{ margin: "4px 0" }}>
                <div className={styles.pitchBar}>
                  <div className={styles.pitchLabel}>Low slope<br /><small>4/12 – 6/12</small></div>
                  <div className={styles.pitchTrack}><div className={`${styles.pitchFill} ${styles.low}`} /></div>
                  <span className={`${styles.pitchNote} ${styles.noteLow}`}>Lower cost</span>
                </div>
                <div className={styles.pitchBar}>
                  <div className={styles.pitchLabel}>Medium<br /><small>7/12</small></div>
                  <div className={styles.pitchTrack}><div className={`${styles.pitchFill} ${styles.mid}`} /></div>
                  <span className={`${styles.pitchNote} ${styles.noteMid}`}>Mid cost</span>
                </div>
                <div className={styles.pitchBar}>
                  <div className={styles.pitchLabel}>Steep<br /><small>8/12+</small></div>
                  <div className={styles.pitchTrack}><div className={`${styles.pitchFill} ${styles.high}`} /></div>
                  <span className={`${styles.pitchNote} ${styles.noteHigh}`}>Higher cost</span>
                </div>
              </div>

              <h3>Roof Complexity</h3>
              <p>
                This is where roofs quietly get expensive. Valleys, dormers, skylights, wall tie-ins - it all adds up. A
                straight up-and-over roof is simple. A cut-up roof with multiple sections can add a few thousand without
                changing the square footage at all. Every extra detail means more cutting, more flashing, and more chances
                for problems if it&apos;s rushed.
              </p>
            </article>

            <div style={{ display: "grid", gap: 16 }}>
              <img
                className={styles.inlineImage}
                src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80&fit=crop&crop=top"
                alt="Steep residential roof showing pitch angle"
                loading="lazy"
              />
              <p className={styles.imgCap}>
                Steep pitch adds significant labour time.
                {" "}<a href="https://unsplash.com/license" target="_blank" rel="noopener">Unsplash License</a>
              </p>

              <article className="ui-card">
                <p className={styles.eyebrow}>Quick note</p>
                <h3>Square footage alone won&apos;t give you the number</h3>
                <p>
                  Pitch, complexity, access, ventilation corrections, and material choice all layer on top of size. That&apos;s
                  why two houses of the same size can quote thousands apart.
                </p>
                <Link href="/quote" className="button" style={{ justifyContent: "center", marginTop: 4 }}>Use the quote tool</Link>
              </article>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.shell} style={{ paddingBottom: 0 }}>
        <div style={{ borderRadius: "var(--r-lg)", overflow: "hidden", border: "1px solid var(--border-light)" }}>
          <img
            src="https://images.unsplash.com/photo-1516156008625-3a9d6067fab5?w=1400&q=80&fit=crop"
            alt="Close-up of asphalt roof shingles texture"
            loading="lazy"
            className={styles.bandImage}
          />
          <div style={{ background: "var(--off)", padding: "10px 20px", fontSize: 11, color: "var(--muted)", borderTop: "1px solid var(--border-light)" }}>
            Photo via <a href="https://unsplash.com/license" target="_blank" rel="noopener" style={{ color: "var(--blue)" }}>Unsplash</a> · Free for commercial use
          </div>
        </div>
      </div>

      <section className={`${styles.section} ${styles.sectionSoft}`}>
        <div className={styles.shell}>
          <article className="ui-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <h2>Material Choice - Where the Big Swings Happen</h2>
              <span className="ui-pill">Calgary-specific</span>
            </div>
            <p>
              Not all shingles are priced the same. In Calgary this matters more than most places. You&apos;re not just picking a
              shingle - you&apos;re deciding how your roof handles Calgary weather over the next 10 to 20 years.
            </p>

            <div className={styles.matGrid}>
              <div className={styles.matCard}>
                <span className="ui-pill">Standard</span>
                <div className={styles.matName}>GAF Timberline</div>
                <ul className={styles.matList}>
                  <li>Most common Calgary choice</li>
                  <li>Solid laminated performance</li>
                  <li>Usually lowest cost tier</li>
                </ul>
              </div>

              <div className={`${styles.matCard} ${styles.matFeatured}`}>
                <span className="ui-pill ui-pill--gold">Popular upgrade</span>
                <div className={styles.matName}>Malarkey</div>
                <ul className={styles.matList}>
                  <li>Rubberized asphalt compound</li>
                  <li>Better impact resistance</li>
                  <li>Strong fit for hail-exposed areas</li>
                </ul>
              </div>

              <div className={styles.matCard}>
                <span className="ui-pill">Premium</span>
                <div className={styles.matName}>Euroshield</div>
                <ul className={styles.matList}>
                  <li>Built specifically for hail</li>
                  <li>Common post-insurance upgrade</li>
                  <li>Higher upfront, longer lifespan</li>
                </ul>
              </div>
            </div>

            <p>
              Class 3 and Class 4 impact ratings matter in Alberta because hail is not a theoretical risk. The practical
              question is whether the roof you choose is appropriate for the house, the neighbourhood exposure, and the
              insurance conversation you may have after the next storm season.
            </p>
          </article>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.shell}>
          <div style={{ marginBottom: 24 }}>
            <p className={styles.eyebrow}>Other cost drivers</p>
            <h2 className={styles.title} style={{ marginTop: 10 }}>More Factors That Shape the Final Number</h2>
          </div>

          <div className={styles.factorGrid}>
            <div className={styles.factorCard}>
              <p className={styles.factorEyebrow}>Installation method</p>
              <h3>Tear-Off vs Overlay</h3>
              <p>
                Most proper jobs here are full tear-offs - old shingles removed, deck checked, new underlayment installed.
                If a quote is significantly cheaper, steps are sometimes being skipped. With Calgary&apos;s freeze-thaw cycles,
                shortcuts usually show up later, not immediately.
              </p>
            </div>

            <div className={styles.factorCard}>
              <p className={styles.factorEyebrow}>Long-term risk</p>
              <h3>Ventilation & Attic Conditions</h3>
              <p>
                Poor ventilation leads to moisture buildup, ice damming, and a shorter roof life. Fixing it adds cost upfront
                - but ignoring it usually costs more later. This is one of those things nobody thinks about until there&apos;s a
                problem showing up inside the house.
              </p>
            </div>

            <div className={styles.factorCard}>
              <p className={styles.factorEyebrow}>Site logistics</p>
              <h3>Access & Setup</h3>
              <p>
                Tight alleys, limited bin placement, detached garages, older neighbourhoods - not the biggest cost driver,
                but it affects labour time especially in established Calgary areas like Ramsay, Hillhurst, or Capitol Hill.
              </p>
            </div>

            <div className={styles.factorCard}>
              <p className={styles.factorEyebrow}>Local market</p>
              <h3>Calgary-Specific Pressures</h3>
              <p>
                Hail exposure, Chinooks causing melt-refreeze cycles, temperature swings during install season - Calgary
                isn&apos;t a generic roofing market. Pricing from other cities doesn&apos;t really translate here, and neither do
                averages from national estimator tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.shell}>
        <div style={{ borderRadius: "var(--r-lg)", overflow: "hidden", border: "1px solid var(--border-light)" }}>
          <img
            src="https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1400&q=80&fit=crop"
            alt="Aerial view of residential neighbourhood rooftops"
            loading="lazy"
            className={styles.aerialImage}
          />
          <div style={{ background: "var(--off)", padding: "10px 20px", fontSize: 11, color: "var(--muted)", borderTop: "1px solid var(--border-light)" }}>
            Photo via <a href="https://unsplash.com/license" target="_blank" rel="noopener" style={{ color: "var(--blue)" }}>Unsplash</a> · Free for commercial use
          </div>
        </div>
      </div>

      <section className={`${styles.section} ${styles.sectionSoft}`}>
        <div className={styles.shell}>
          <div className={styles.detailGrid} style={{ alignItems: "start" }}>
            <article className="ui-card">
              <h2>What a Good Quote Should Include</h2>
              <p>
                When you&apos;re comparing quotes, this is what you want to see clearly laid out. If it&apos;s vague, there&apos;s usually
                something missing - and that&apos;s where the real gap between quotes lives.
              </p>
              <ul className={styles.checklist}>
                <li><div className={styles.checkBox}>✓</div>Full tear-off of existing shingles</li>
                <li><div className={styles.checkBox}>✓</div>Ice and water membrane in valleys and edges</li>
                <li><div className={styles.checkBox}>✓</div>Ventilation checked or corrected</li>
                <li><div className={styles.checkBox}>✓</div>Proper flashing around walls and penetrations</li>
                <li><div className={styles.checkBox}>✓</div>Cleanup and disposal included</li>
              </ul>
            </article>

            <article className="ui-card">
              <h2>What to Expect in 2026</h2>
              <p>Realistically in Calgary for 2026:</p>
              <div className={styles.tierList}>
                <div className={styles.tier}>
                  <div>
                    <p className={styles.tierLabel}>Standard</p>
                    <p className={styles.tierDesc}>Basic asphalt shingle roof</p>
                  </div>
                  <div className={styles.tierPrice}>$8K – $12K</div>
                </div>

                <div className={styles.tier}>
                  <div>
                    <p className={styles.tierLabel}>Upgraded</p>
                    <p className={styles.tierDesc}>Impact-resistant shingles</p>
                  </div>
                  <div className={styles.tierPrice}>$10K – $16K</div>
                </div>

                <div className={`${styles.tier} ${styles.tierPremium}`}>
                  <div>
                    <p className={styles.tierLabel}>Premium</p>
                    <p className={styles.tierDesc}>Euroshield rubber system</p>
                  </div>
                  <div className={styles.tierPrice}>$15K+</div>
                </div>
              </div>
              <p>
                If something comes in well below these ranges, there&apos;s usually a reason. If it&apos;s well above, you should be
                able to get a clear explanation of exactly why.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.shell}>
          <article className="ui-card">
            <h2>Final Thought</h2>
            <p>
              Most people focus on the price first. What actually matters is how that roof holds up after a couple of
              hailstorms and a few freeze-thaw cycles. That&apos;s where the real difference shows up - not on the day of
              installation, but two or three years later.
            </p>
            <p>
              The goal isn&apos;t to find the cheapest number. It&apos;s to understand what you&apos;re getting at every price point, so
              you can make a decision that makes sense for your house and your situation.
            </p>
          </article>
        </div>
      </section>

      <section className={styles.ctaBand}>
        <div className={styles.shell}>
          <h2 className={styles.title}>Want a real number based on your house?</h2>
          <p className={styles.copy}>
            Use the instant quote tool. It uses real Calgary project data - your pitch, your area, your scope. Takes about a
            minute and gives you something real to work with, not just a range pulled from the internet.
          </p>
          <div className={styles.ctaActions}>
            <Link href="/quote" className="button">Get an instant roof quote →</Link>
            <Link href="/services/roofing" className="button button--ghost">Roof replacement services</Link>
          </div>
        </div>
      </section>
    </>
  );
}
