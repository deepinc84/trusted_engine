import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "/", label: "Home" }
  { href: "/services", label: "Services" },
  { href: "/projects", label: "Projects" },
  ];

export default function SiteHeader() {
  return (
    <header className="site-header site-header--v3">
      <div className="site-shell site-header__inner">
        <Link href="/" className="brand" aria-label="Trusted Roofing home">
          <Image
            src="/logo.svg"
            alt="Trusted Roofing & Exteriors"
            width={208}
            height={72}
            className="brand-logo"
            priority
          />
        </Link>

        <nav className="nav nav--v3" aria-label="Main navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
          <Link href="/quote" className="cta">
            Get instant quote
          </Link>
        </nav>
      </div>
    </header>
  );
}
