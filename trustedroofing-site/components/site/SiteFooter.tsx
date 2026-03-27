import Image from "next/image";
import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer site-footer--v3">
      <div className="site-shell site-footer__grid site-footer__grid--expanded">
        <div className="site-footer__brand-block">
          <div className="site-footer__brand">
            <Image src="/white-transparent-t.png" alt="Trusted" width={56} height={56} className="site-footer__logo" />
            <div>
              <strong className="site-footer__brand-name">
                <span className="site-footer__brand-name-main">TRUSTED</span>{" "}
                <span className="site-footer__brand-name-sub">Roofing & Exteriors</span>
              </strong>
              <p className="site-footer__brand-location">Calgary, Alberta</p>
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
          <a href="tel:5872883351">587-288-3351</a>
          <a href="mailto:info@trustedexteriors.ca">info@trustedexteriors.ca</a>
          <Link href="/online-estimate">Get a quote</Link>
        </div>
      </div>
      <div className="site-shell site-footer__bottom">
        <p>© {new Date().getFullYear()} Trusted Roofing and Exteriors Inc. Calgary, AB. All rights reserved.</p>
        <div className="site-footer__legal">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Serving Calgary & area</a>
        </div>
      </div>
    </footer>
  );
}
