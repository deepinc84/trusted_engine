import Link from "next/link";
import { buildMetadata, canonicalUrl } from "@/lib/seo";

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
    headline: "Calgary Wind Damage This Week, What We're Seeing on Roofs, Siding, and Exteriors",
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

const articleWrap: React.CSSProperties = {
  maxWidth: 800,
  margin: "0 auto",
  padding: "clamp(24px, 4vw, 40px) 20px 72px",
  lineHeight: 1.75,
  color: "var(--ink-900)"
};

const sectionSpace: React.CSSProperties = {
  marginTop: "clamp(48px, 8vw, 72px)"
};

const imageStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 16,
  display: "block",
  marginTop: 18
};

const metaRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 14,
  fontSize: 14,
  color: "var(--ink-500)",
  marginTop: 10,
  marginBottom: 22
};

export default function WindDamageBlogPost() {
  const schema = buildBlogSchema();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <article style={articleWrap}>
        <p style={{ fontSize: 13, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-500)", margin: 0 }}>
          Calgary · Storm Damage Update
        </p>
        <h1 style={{ marginTop: 10, lineHeight: 1.15 }}>
          Calgary Wind Damage This Week, What We&apos;re Seeing on Roofs, Siding, and Exteriors
        </h1>

        <div style={metaRow}>
          <span>Published: April 30, 2026</span>
          <span>Updated: April 30, 2026</span>
          <span>Reading time: ~5–6 minutes</span>
        </div>

        <p>
          Over the past week, strong winds across Calgary and surrounding areas have caused a sharp increase in exterior
          damage.
        </p>
        <p>This is not isolated.</p>
        <p>
          It is showing up across multiple properties, and a lot of the damage is not visible from the ground.
        </p>

        <img src="/calgary-wind-damage-roof.jpeg" alt="Calgary roof with major wind blow-off exposing lower roof layers" style={imageStyle} loading="eager" />
        <p style={{ marginTop: 8, fontSize: 14, color: "var(--ink-500)" }}>
          Missing shingles and exposed layers from a recent Calgary wind event.
        </p>

        <section style={sectionSpace}>
          <h2>What Wind Is Actually Doing to Roofs Right Now</h2>
          <p>Wind doesn&apos;t need to rip a roof apart to cause problems.</p>
          <p>In most cases, it:</p>
          <ul>
            <li>lifts shingles and breaks their seal</li>
            <li>creases them so they fail later</li>
            <li>exposes underlayment and nail lines</li>
          </ul>
          <p>Once that happens, the roof is vulnerable even if it still looks fine.</p>
          <p>Example from this week:</p>
          <p>Shingles blown off completely, exposing the decking underneath.</p>
          <p>This is no longer a small repair. Once wood is exposed, the system is already compromised.</p>
          <p>
            If you&apos;re seeing anything like this, it&apos;s time to plan <Link href="/services/roof-repair">roof repair in Calgary</Link> before the next storm makes it worse.
          </p>
        </section>

        <section style={sectionSpace}>
          <h2>The Damage You Don&apos;t See Yet</h2>
          <p>Not all damage shows up as missing shingles.</p>
          <p>A lot of roofs right now have:</p>
          <ul>
            <li>lifted tabs</li>
            <li>broken seals</li>
            <li>weakened sections that haven&apos;t failed yet</li>
          </ul>
          <p>Example:</p>
          <p>Shingles lifted and creased, but still in place.</p>
          <p>This is the stage right before full blow-off in the next wind event.</p>
          <p>Most homeowners miss this completely.</p>

          <img src="/missing-shingle-wind-damage.jpeg" alt="Wind-lifted shingles with exposed roof area and underlayment" style={imageStyle} loading="lazy" />
          <p style={{ marginTop: 8, fontSize: 14, color: "var(--ink-500)" }}>
            Lifted and missing shingle sections that often precede wider blow-off.
          </p>
        </section>

        <section style={sectionSpace}>
          <h2>Siding Damage, Vinyl vs Hardie</h2>
          <p>We&apos;ve also seen siding taking hits this week.</p>
          <h3>Vinyl siding</h3>
          <ul>
            <li>loosens under pressure</li>
            <li>pulls apart at seams</li>
            <li>cracks when stressed in colder temperatures</li>
          </ul>
          <p>Once it starts moving, sections can come off quickly.</p>
          <h3>James Hardie siding</h3>
          <ul>
            <li>more rigid and impact resistant</li>
            <li>less movement at seams</li>
            <li>holds up better in sustained wind conditions</li>
          </ul>
          <p>It&apos;s not immune, but it performs significantly better in Alberta weather.</p>
          <p>
            If you&apos;re dealing with damage or planning upgrades, this falls under <Link href="/services/siding">siding installation in Calgary</Link>.
          </p>

          <img src="/vinyl-siding-wind-damage-calgary.JPG" alt="Wind-damaged siding and soffit area on a Calgary home" style={imageStyle} loading="lazy" />
          <p style={{ marginTop: 8, fontSize: 14, color: "var(--ink-500)" }}>
            Siding movement and separation caused by sustained wind pressure.
          </p>
        </section>

        <section style={sectionSpace}>
          <h2>Soffit Failure and Pressure Damage</h2>
          <p>Wind doesn&apos;t just hit the roof, it gets underneath it.</p>
          <p>We&apos;ve seen multiple soffit failures this week.</p>
          <p>Example:</p>
          <p>A soffit section blown out completely, exposing the attic space.</p>
          <p>This happens when:</p>
          <ul>
            <li>pressure builds in the roof system</li>
            <li>panels aren&apos;t secured properly</li>
            <li>wind finds a weak point</li>
          </ul>
          <p>Once soffit is gone:</p>
          <ul>
            <li>moisture can enter</li>
            <li>ventilation is disrupted</li>
            <li>pests become a risk</li>
          </ul>

          <img src="/missing-soffit-calgary-wind-storm.JPG" alt="Missing soffit panel with exposed attic cavity after wind damage" style={imageStyle} loading="lazy" />
          <p style={{ marginTop: 8, fontSize: 14, color: "var(--ink-500)" }}>
            Soffit panel failure exposing attic space and disrupting airflow.
          </p>
        </section>

        <section style={sectionSpace}>
          <h2>Wind-Driven Debris and Gutter Damage</h2>
          <p>Not all damage is from wind alone.</p>
          <p>In many cases, debris and nearby trees are making contact with homes during these wind events.</p>
          <p>Example:</p>
          <p>Eavestrough system deformed from impact.</p>
          <p>This is typically caused by:</p>
          <ul>
            <li>branches hitting the roof edge</li>
            <li>debris being carried across the roofline</li>
            <li>repeated movement during sustained wind</li>
          </ul>
          <p>Once gutters are compromised:</p>
          <ul>
            <li>drainage fails</li>
            <li>water backs up into the roof edge</li>
            <li>fascia and soffit areas become more vulnerable</li>
          </ul>
          <p>
            If your roofline looks off, it&apos;s worth addressing <Link href="/services/gutters">eavestrough repair in Calgary</Link> before it leads to bigger problems.
          </p>

          <img src="/gutter-wind-damage-fallen-tree.jpg" alt="Gutter deformation caused by wind-driven debris and branch contact" style={imageStyle} loading="lazy" />
          <p style={{ marginTop: 8, fontSize: 14, color: "var(--ink-500)" }}>
            Eavestrough deformation from debris impact and branch contact during high winds.
          </p>
        </section>

        <section style={sectionSpace}>
          <h2>Flashing and Penetration Weak Points</h2>
          <p>Another issue we&apos;re seeing is exposed or improperly protected penetrations.</p>
          <p>Example:</p>
          <p>Exposed membrane and incomplete flashing around a roof penetration.</p>
          <p>These areas are always high-risk:</p>
          <ul>
            <li>wind gets under them easily</li>
            <li>water follows right behind</li>
            <li>small issues turn into leaks fast</li>
          </ul>

          <img src="/fascia-blown-off-wind-storm-calgary.JPG" alt="Exposed fascia and edge flashing displacement after wind damage" style={imageStyle} loading="lazy" />
          <p style={{ marginTop: 8, fontSize: 14, color: "var(--ink-500)" }}>
            Roof edge and flashing weakness where wind pressure can quickly escalate damage.
          </p>
        </section>

        <section style={sectionSpace}>
          <h2>What This Means for Homeowners Right Now</h2>
          <p>The biggest issue after wind events like this is not checking early.</p>
          <p>Most people:</p>
          <ul>
            <li>assume no visible damage means no problem</li>
            <li>wait until something leaks</li>
            <li>delay repairs</li>
          </ul>
          <p>By the time there&apos;s a visible issue, it&apos;s usually no longer a small fix.</p>
        </section>

        <section style={sectionSpace}>
          <h2>How to Prevent This Going Forward</h2>
          <p>You can&apos;t stop wind, but you can reduce how much damage it causes.</p>
          <p>What actually helps:</p>
          <ul>
            <li>proper shingle installation and fastening</li>
            <li>reinforced ridge and edge systems</li>
            <li>better siding material selection</li>
            <li>secure soffit and fascia installation</li>
            <li>routine inspections after major storms</li>
          </ul>
          <p>
            This is where working with a <Link href="/services/roofing">roofing contractor in Calgary</Link> who understands local conditions matters.
          </p>
        </section>

        <section style={{ ...sectionSpace, textAlign: "center", padding: "clamp(24px, 4vw, 36px)", background: "var(--surface-50)", border: "1px solid var(--border-light)", borderRadius: 16 }}>
          <h2>Not Sure What Condition Your Roof Is In?</h2>
          <p>
            After a week like this, a lot of homeowners don&apos;t know if they&apos;re dealing with minor damage or something more serious.
          </p>
          <p>
            If you want a starting point: use the instant quote tool to get a rough idea of repair or replacement costs based on your home.
          </p>
          <p>From there, you can decide whether it needs immediate attention or just monitoring.</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginTop: 14 }}>
            <Link href="/online-estimate" className="button">Use the instant quote tool</Link>
            <Link href="/services/roof-repair" className="button button--ghost">Roof repair services</Link>
          </div>
        </section>
      </article>
    </>
  );
}
