import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import HeatMap from "@/components/HeatMap";
import { getProjectQuadrantHeat, getProjectQuadrantLinks, getTopProjectNeighborhoods } from "@/lib/seo-engine";

const links = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/projects", label: "Projects" }
];

export default async function SiteHeader() {
  const cookieStore = cookies();
  const adminCookie = cookieStore.get("admin_token")?.value;
  const adminToken = process.env.ADMIN_TOKEN;
  const isAdminSession = !!adminToken && adminCookie === adminToken;

  const [serviceAreas, heatmap, heatLinks] = await Promise.all([
    getTopProjectNeighborhoods(10),
    getProjectQuadrantHeat(),
    getProjectQuadrantLinks()
  ]);

  return (
    <header className="site-header site-header--v3">
      <div className="site-shell site-header__inner">
        <Link href="/" className="brand" aria-label="Trusted Roofing home">
          {/* Keep original production brand asset per stakeholder request. */}
          <Image
            src="/full_white_new2.png"
            alt="Trusted Roofing & Exteriors"
            width={160}
            height={52}
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
          {isAdminSession ? (
            <Link href="/admin" className="cta" style={{ marginRight: 8 }}>
              Admin
            </Link>
          ) : null}
          <a href="tel:5872883351" className="nav-tel">
            587-288-3351
          </a>
          <Link href="/online-estimate" className="cta">
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
