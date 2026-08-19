import Link from "next/link";
export default function RoofRejuvenationPromo() {
  return (
    <section className="home-rejuvenation-promo">
      <div className="site-shell">
        <div className="ui-card home-rejuvenation-promo__card">
          <p className="homev3-eyebrow">New roof preservation option</p>
          <h2>New: Get a Fixed Roof Rejuvenation Quote</h2>
          <p>Aging asphalt shingles may qualify for a roof preservation treatment starting at $1,595. Enter your address to compare the exact treatment price with the current estimated cost of replacement.</p>
          <div className="rejuvenation-promo-actions">
            <Link className="button rejuvenation-promo-action rejuvenation-promo-action--primary" href="/online-estimate?intent=roof-rejuvenation">Check My Roof</Link>
            <Link className="button rejuvenation-promo-action rejuvenation-promo-action--secondary" href="/services/roof-rejuvenation">Learn About Roof Rejuvenation</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
