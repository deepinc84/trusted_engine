import Link from "next/link";
import { getQuoteQuadrantHeat, getTopQuoteNeighborhoods } from "@/lib/seo-engine";

export default async function QuoteActivitySummary() {
  const [quadrants, neighborhoods] = await Promise.all([
    getQuoteQuadrantHeat(),
    getTopQuoteNeighborhoods(6)
  ]);

  const quadrantRows = [
    { label: "NW Calgary", value: quadrants.NW },
    { label: "NE Calgary", value: quadrants.NE },
    { label: "SW Calgary", value: quadrants.SW },
    { label: "SE Calgary", value: quadrants.SE }
  ];

  return (
    <section className="ui-card quote-support-card" aria-labelledby="calgary-activity-title">
      <p className="ui-page-hero__eyebrow">Local pricing context</p>
      <h2 id="calgary-activity-title">Real-Time Exterior Pricing Across Calgary</h2>
      <p>
        Calgary exterior pricing shifts with roof complexity, site access, home height, disposal loads, material
        selection, hail exposure, freeze/thaw cycles, and seasonal crew demand. The instant estimator reflects these
        moving conditions using local quote activity and address-level geometry.
      </p>
      <p>
        If you want a scope-specific baseline first, check our <Link href="/services/roofing">Calgary roofing price estimator</Link>
        {" "}or use our <Link href="/services">instant exterior estimate tool</Link> for multi-trade planning.
      </p>
      <h3 style={{ marginBottom: 8 }}>Recent Estimator Activity by Quadrant</h3>
      <ul style={{ marginTop: 0 }}>
        {quadrantRows.map((row) => (
          <li key={row.label}>
            <strong>{row.label}:</strong> {row.value > 0 ? `${row.value} recent quote signals` : "Active seasonal pricing shifts; generate an address-based estimate for current range."}
          </li>
        ))}
      </ul>
      {neighborhoods.length > 0 ? (
        <>
          <h3 style={{ marginBottom: 8 }}>Active Calgary communities</h3>
          <p style={{ marginTop: 0 }}>
            {neighborhoods
              .map((item) => `${item.neighborhood}${item.quadrant ? ` (${item.quadrant})` : ""}`)
              .join(", ")}
            .
          </p>
        </>
      ) : null}
    </section>
  );
}
