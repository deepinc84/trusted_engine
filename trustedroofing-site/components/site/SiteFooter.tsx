import Image from "next/image";
import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer site-footer--v3">
      <div className="site-shell site-footer__grid site-footer__grid--expanded">
        <div className="site-footer__brand-block">
          <div className="site-footer__brand">
            <Image src="/IMG_0326.jpeg" alt="Trusted" width={36} height={36} />
            <div>
              <strong>Trusted Roofing & Exteriors</strong>
              <p>Calgary, Alberta</p>
            </div>
          </div>
          <p className="site-footer__copy">
            Premium roofing and exterior work for Calgary homeowners. Fast quotes, clear communication, dependable workmanship.
          </p>
        </div>

        <div>
          <h4>Services</h4>
          <Link href="/services/roofing">Roof Replacement</Link>
          <Link href="/services/roof-repair">Repairs & Leaks</Link>
          <Link href="/services">Siding & Exterior</Link>
          <Link href="/services">Eavestrough</Link>
        </div>

        <div>
          <h4>Projects</h4>
          <Link href="/projects">Featured Work</Link>
          <Link href="/projects">Recent Activity</Link>
          <Link href="/projects">Before & After</Link>
        </div>

        <div>
          <h4>Company</h4>
          <Link href="/">About Trusted</Link>
          <Link href="/services">How it works</Link>
          <Link href="/projects">Reviews</Link>
          <Link href="/#areas">Service areas</Link>
        </div>

        <div>
          <h4>Contact</h4>
          <a href="tel:4035550124">(403) 555-0124</a>
          <a href="mailto:hello@trusted.ca">hello@trusted.ca</a>
          <Link href="/quote">Get a quote</Link>
        </div>
      </div>
      <div className="site-shell site-footer__bottom">
        <p>© {new Date().getFullYear()} Trusted Exteriors Ltd. Calgary, AB. All rights reserved.</p>
        <div className="site-footer__legal">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Serving Calgary & area</a>
        </div>
      </div>
    </footer>
  );
}
