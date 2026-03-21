import Link from "next/link";
import type { HomeArea } from "./types";

export default function ServiceAreas({ areas }: { areas: HomeArea[] }) {
  return (
    <section className="homev3-section homev3-section--tint" id="areas">
      <div className="homev3-container homev3-areas-layout">
        <div>
          <p className="homev3-eyebrow homev3-eyebrow--dark">Where we work</p>
          <h2 className="homev3-title">Serving Calgary neighborhoods</h2>
        </div>
        <div className="homev3-area-chips">
          {areas.filter((area) => area.active).map((area) => (
            <Link
              key={area.id}
              href={`/service-areas/${area.slug}`}
              prefetch={false}
            >
              {area.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
