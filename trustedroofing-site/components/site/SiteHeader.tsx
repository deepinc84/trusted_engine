import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "/services", label: "Services" },
  { href: "/projects", label: "Projects" },
  { href: "/quote", label: "Quote" }
];

export default function SiteHeader() {
  return (
    <header className="site-header site-header--v3">
      <div className="site-shell">
        <Link href="/" className="brand">
          <Image
            src="/logo.svg"
            alt="Trusted Roofing & Exteriors"
            width={200}
            height={72}
            className="brand-logo"
            priority
          />
        </Link>
        <nav className="nav nav--v3">
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
