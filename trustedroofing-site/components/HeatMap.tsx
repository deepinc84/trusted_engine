import type { QuadrantHeat } from "@/lib/seo-engine";

type QuadrantLinks = Partial<Record<"NW" | "NE" | "SW" | "SE", string | null>>;

function fillOpacity(value: number, max: number) {
  if (max === 0) return 0.18;
  return 0.18 + (value / max) * 0.72;
}

export default function HeatMap({
  counts,
  links
}: {
  counts: QuadrantHeat;
  links?: QuadrantLinks;
}) {
  const max = Math.max(counts.NW, counts.NE, counts.SW, counts.SE, 1);
  const quadrants = [
    { key: "NW", x: 0, y: 0, value: counts.NW },
    { key: "NE", x: 112, y: 0, value: counts.NE },
    { key: "SW", x: 0, y: 112, value: counts.SW },
    { key: "SE", x: 112, y: 112, value: counts.SE }
  ] as const;

  return (
    <div className="quadrant-heatmap">
      <svg viewBox="0 0 224 224" role="img" aria-label="Calgary quote coverage by quadrant">
        <title>Calgary quote coverage by quadrant</title>
        {quadrants.map((quadrant) => (
          <g key={quadrant.key}>
            <a href={links?.[quadrant.key] ? `/service-areas/${links[quadrant.key]}` : undefined}>
              <rect
                x={quadrant.x}
                y={quadrant.y}
                width="100"
                height="100"
                rx="18"
                fill={`rgba(47, 78, 140, ${fillOpacity(quadrant.value, max)})`}
                stroke="rgba(15, 30, 56, 0.16)"
              />
              <text x={quadrant.x + 50} y={quadrant.y + 44} textAnchor="middle" className="quadrant-heatmap__label">
                {quadrant.key}
              </text>
              <text x={quadrant.x + 50} y={quadrant.y + 66} textAnchor="middle" className="quadrant-heatmap__value">
                {quadrant.value}
              </text>
            </a>
          </g>
        ))}
      </svg>
    </div>
  );
}
