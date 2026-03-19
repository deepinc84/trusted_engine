import Link from "next/link";

export default function HomeFooter() {
  return (
    <section className="homev3-home-footer">
      <div className="homev3-container homev3-home-footer__grid">
        <div>
          <h3>Trusted Roofing & Exteriors</h3>
          <p>
            Premium roofing and exterior work for Calgary homeowners with fast quotes and
            dependable workmanship.
          </p>
        </div>
        <div>
          <h4>Services</h4>
          <Link href="/services/roofing">Roofing</Link>
          <Link href="/services/roof-repair">Roof repair</Link>
          <Link href="/services">Siding & exteriors</Link>
        </div>
        <div>
          <h4>Explore</h4>
          <Link href="/projects">Projects</Link>
          <Link href="/quote">Instant quote</Link>
          <Link href="/services">Service areas</Link>
        </div>
      </div>
    </section>
  );
}
