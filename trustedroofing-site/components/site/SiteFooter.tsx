import Image from "next/image";
import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer site-footer--v3">
      <div className="site-shell site-footer__grid">
        <div>
          <div className="site-footer__brand">
            <Image src="/logo-mark.svg" alt="Trusted" width={38} height={38} />
            <div>
              <strong>Trusted Roofing & Exteriors</strong>
              <p>Calgary, Alberta</p>
            </div>
          </div>
          <p className="site-footer__copy">
            Roofing, siding, gutters, and exterior systems delivered with project-backed scopes and fast estimates.
          </p>
        </div>

        <div>
          <h4>Explore</h4>
          <Link href="/services">Services</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/quote">Instant quote</Link>
        </div>

        <div>
          <h4>Contact</h4>
          <a href="tel:4035550124">(403) 555-0124</a>
          <a href="mailto:hello@trusted.ca">hello@trusted.ca</a>
          <p>Mon-Sat, 8am-6pm</p>
        </div>
      </div>
      <div className="site-shell site-footer__bottom">
        <p>© {new Date().getFullYear()} Trusted Roofing & Exteriors. All rights reserved.</p>
      </div>
    </footer>
  );
}
