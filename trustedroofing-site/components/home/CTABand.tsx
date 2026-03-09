import Link from "next/link";

export default function CTABand() {
  return (
    <section className="homev3-cta" id="cta">
      <div className="homev3-container">
        <p className="homev3-eyebrow">Ready to start?</p>
        <h2 className="homev3-title">Get an instant estimate for your roof or exterior project</h2>
        <p className="homev3-copy homev3-copy--muted">
          See pricing ranges quickly, informed by real Calgary activity.
        </p>
        <div className="homev3-hero__actions">
          <Link href="/quote" className="button">Start instant quote</Link>
          <a href="tel:4035550124" className="button button--ghost">Call (403) 555-0124</a>
        </div>
      </div>
    </section>
  );
}
