import Link from "next/link";
import type { HomeArea } from "./types";
import { normalizeNeighborhoodSlug } from "@/lib/serviceAreas";

export default function ServiceAreas({ areas }: { areas: HomeArea[] }) {
  return (
    <section className="homev3-section homev3-section--tint" id="areas">
      <div className="homev3-container homev3-areas-layout">
        <div className="homev3-areas-intro">
          <p className="homev3-eyebrow homev3-eyebrow--dark">Where we work</p>
          <h2 className="homev3-title">Serving Calgary neighborhoods</h2>
          <p className="homev3-copy">
            Live project coverage across Calgary, with direct links into the neighborhoods where Trusted Roofing is actively publishing work and pricing context.
          </p>
        </div>
        <div className="homev3-area-chips">
          {areas.filter((area) => area.active).map((area) => {
            const slug = normalizeNeighborhoodSlug(area.slug || area.name);

            return (
              <Link
                key={area.id}
                href={`/service-areas/${slug}`}
                prefetch={false}
              >
                {area.name}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
