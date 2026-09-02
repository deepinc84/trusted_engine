import Link from "next/link";
import BusinessProfilesSection from "@/components/about/BusinessProfilesSection";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import { ORGANIZATION_ID } from "@/lib/organization";
import { buildMetadata } from "@/lib/seo";
import styles from "./about.module.css";

export const metadata = buildMetadata({
  title: "About Trusted Roofing & Exteriors | Calgary Roofing Contractor",
  description: "Learn about Trusted Roofing & Exteriors, a Calgary roofing and exterior contractor serving homeowners throughout Calgary, and find our business profiles across contractor, local and business directories.",
  path: "https://trustedroofingcalgary.com/about"
});

export default function AboutPage() {
  const aboutPageSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": "https://trustedroofingcalgary.com/about#webpage",
    url: "https://trustedroofingcalgary.com/about",
    name: "About Trusted Roofing & Exteriors",
    // Reference the site-wide entity instead of publishing another business.
    about: { "@id": ORGANIZATION_ID }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageSchema) }} />
      <PageHero
        eyebrow="Calgary roofing and exterior services"
        title="About Trusted Roofing & Exteriors"
        description="Trusted Roofing & Exteriors is a Calgary, Alberta residential roofing and exterior contractor serving homeowners throughout Calgary. We help with roofing repairs, maintenance and replacement, along with practical exterior services for the rest of the home."
        actions={<Link href="/online-estimate" className="button">Start an online estimate</Link>}
      />

      <section className="ui-page-section">
        <PageContainer>
          <div className={styles.identity}>
            <article className="ui-card">
              <p className="homev3-eyebrow">About the company</p>
              <h2>Working with Calgary homeowners</h2>
              <p>Trusted Roofing & Exteriors helps homeowners plan complete roof replacements, targeted roof repairs and solutions for leak-related roofing issues. Our roofing work also includes inspections, preventative maintenance, asphalt shingle rejuvenation, and hail and storm damage repair.</p>
              <p>Exterior services include siding, eavestroughs, downspouts, soffit and fascia. Homeowners who are beginning to plan can use our <Link href="/online-estimate">online estimate</Link> to explore a project before discussing the details with our team.</p>
            </article>
            <aside className="ui-card" aria-labelledby="company-information-heading">
              <h2 id="company-information-heading">Company information</h2>
              <dl className={styles.facts}>
                <div><dt>Business</dt><dd>Trusted Roofing & Exteriors</dd></div>
                <div><dt>Location</dt><dd>Calgary, Alberta</dd></div>
                <div><dt>Phone</dt><dd><a href="tel:5872883351">587-288-3351</a></dd></div>
                <div><dt>Website</dt><dd><a href="https://trustedroofingcalgary.com">trustedroofingcalgary.com</a></dd></div>
                <div><dt>Business type</dt><dd>Residential Roofing &amp; Exterior Contractor</dd></div>
                <div><dt>Service model</dt><dd>Service-Area Business</dd></div>
              </dl>
            </aside>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section">
        <PageContainer>
          <p className="homev3-eyebrow">What we do</p>
          <h2>Roofing and exterior services</h2>
          <div className={styles.services}>
            <article className="ui-card">
              <h3><Link href="/services/roofing">Roofing</Link></h3>
              <ul>
                <li><Link href="/services/roof-replacement">Roof Replacement</Link></li>
                <li><Link href="/services/roof-repair">Roof Repair</Link></li>
                <li>Asphalt Shingle Roofing</li>
                <li><Link href="/services/roof-inspection-maintenance">Roof Inspections &amp; Maintenance</Link></li>
                <li><Link href="/services/roof-rejuvenation">Roof Rejuvenation</Link></li>
                <li>Hail &amp; Storm Damage Repair</li>
              </ul>
            </article>
            <article className="ui-card">
              <h3><Link href="/services/siding">Exteriors</Link></h3>
              <ul>
                <li><Link href="/services/siding">Siding Installation &amp; Repair</Link></li>
                <li><Link href="/services/james-hardie-siding">James Hardie Siding</Link></li>
                <li><Link href="/services/eavestrough">Eavestrough Installation &amp; Repair</Link></li>
                <li>Downspouts</li>
                <li><Link href="/services/eavestrough-soffit-fascia">Soffit</Link></li>
                <li><Link href="/services/eavestrough-soffit-fascia">Fascia</Link></li>
              </ul>
            </article>
          </div>
        </PageContainer>
      </section>

      <BusinessProfilesSection />
      <CtaBand title="Planning work on your Calgary home?" body="Tell us about the roofing or exterior work you are considering and start with an online estimate." primaryLabel="Start an online estimate" />
    </>
  );
}
