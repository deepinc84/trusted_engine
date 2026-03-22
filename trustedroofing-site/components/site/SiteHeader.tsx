import Image from "next/image";
import Link from "next/link";
import HeatMap from "@/components/HeatMap";
import { getProjectQuadrantHeat, getProjectQuadrantLinks, getTopProjectNeighborhoods } from "@/lib/seo-engine";

const links = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/projects", label: "Projects" }
];

export default async function SiteHeader() {
  const [serviceAreas, heatmap, heatLinks] = await Promise.all([
    getTopProjectNeighborhoods(10),
    getProjectQuadrantHeat(),
    getProjectQuadrantLinks()
  ]);

  return (
    <header className="site-header site-header--v3">
      <div className="site-shell site-header__inner">
        <Link href="/" className="brand" aria-label="Trusted Roofing home">
          <Image
            src="/4CFA7BE7-4888-4966-AF0C-5E2AA6469E80.png"
            alt="Trusted Roofing & Exteriors"
            width={1536}
            height={1024}
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
          <div className="nav-service-areas">
            <Link href="/service-areas">Service Areas</Link>
            <div className="nav-service-areas__dropdown">
              <div>
                <p className="nav-service-areas__eyebrow">Top Calgary project areas</p>
                <div className="nav-service-areas__list">
                  {serviceAreas.map((area) => (
                    <Link key={area.slug} href={`/service-areas/${area.slug}`}>
                      <span>{area.neighborhood}</span>
                      <strong>{area.projectCount}</strong>
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="nav-service-areas__eyebrow">Project heat</p>
                <HeatMap counts={heatmap} links={heatLinks} />
              </div>
            </div>
          </div>
        </nav>

        <div className="nav-right">
          <a href="tel:5872883351" className="nav-tel">
            587-288-3351
          </a>
          <Link href="/quote" className="cta">
            Get instant quote
          </Link>
        </div>
      </div>
      {/* <div className="site-shell">
        <HeaderLocationProbe />
      </div> */}
    </header>
  );
}
