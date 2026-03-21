import Link from "next/link";
import HeatMap from "@/components/HeatMap";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import { getQuoteQuadrantHeat, getTopQuoteNeighborhoods } from "@/lib/seo-engine";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Service areas",
  description: "Live Calgary neighborhood coverage based on recent quote activity and project demand.",
  path: "/service-areas"
});

export default async function ServiceAreasPage() {
  const [areas, heat] = await Promise.all([
    getTopQuoteNeighborhoods(10),
    getQuoteQuadrantHeat()
  ]);

  return (
    <>
      <PageHero
        eyebrow="Coverage engine"
        title="Calgary service areas"
        description="Neighborhood pages and quote density update from Calgary quote activity to keep local landing pages current."
      />

      <section className="ui-page-section">
        <PageContainer>
          <div className="service-area-shell">
            <article className="ui-card">
              <h2>Most active neighborhoods</h2>
              <div className="service-area-list">
                {areas.map((area) => (
                  <Link key={area.slug} href={`/service-areas/${area.slug}`}>
                    <span>{area.neighborhood}</span>
                    <strong>{area.quoteCount}</strong>
                  </Link>
                ))}
              </div>
            </article>

            <article className="ui-card">
              <h2>Quadrant quote heat</h2>
              <p className="homev3-copy">Opacity reflects the volume of Calgary quote activity recorded in each quadrant.</p>
              <HeatMap counts={heat} />
            </article>
          </div>
        </PageContainer>
      </section>
    </>
  );
}
