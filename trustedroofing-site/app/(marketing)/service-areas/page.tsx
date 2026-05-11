import Link from "next/link";
import HeatMap from "@/components/HeatMap";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import {
  getQuoteQuadrantHeat,
  getTopNeighborhoodActivities,
} from "@/lib/seo-engine";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Service areas",
  description:
    "Live Calgary neighborhood coverage based on recent quote activity and project demand.",
  path: "/service-areas",
});

export const dynamic = "force-dynamic";

export default async function ServiceAreasPage() {
  const [areas, heat] = await Promise.all([
    getTopNeighborhoodActivities(10),
    getQuoteQuadrantHeat(),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Coverage engine"
        title="Calgary service areas"
        description="Neighborhood pages update from quote, project, and solar suitability activity to keep local landing pages current."
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
                    <strong>
                      {area.quoteCount +
                        area.projectCount +
                        area.solarActivityCount}
                    </strong>
                  </Link>
                ))}
              </div>
            </article>

            <article className="ui-card">
              <h2>Quadrant quote heat</h2>
              <p className="homev3-copy">
                Opacity reflects the volume of Calgary quote activity recorded
                in each quadrant.
              </p>
              <HeatMap counts={heat} />
            </article>
          </div>

          <section className="mt-10 space-y-6">
            <h1>Calgary Service Areas for Roofing, Siding, and Eavestrough</h1>
            <p className="homev3-copy">
              Calgary roofing needs are not one-size-fits-all, even between
              neighborhoods that look similar on a map. Wind exposure, hail
              impact history, attic ventilation, and lot-level drainage all
              change how quickly systems wear down and how roof replacement
              Calgary projects should be scoped. A roof in one quadrant can age
              differently from another because of slope, orientation, and
              weather patterns. That is why we break service area planning
              across NW, NE, SW, and SE Calgary instead of using a generic
              city-wide assumption. The same practical approach applies to
              siding and Calgary eavestrough work: details around water
              movement, flashing, and ventilation matter more than marketing
              labels. The goal is straightforward—use local conditions and real
              quote activity to recommend a cleaner, longer-lasting scope.
            </p>

            <h2>Roofing Conditions by Calgary Quadrant</h2>

            <h3>NW Calgary</h3>
            <p className="homev3-copy">
              NW Calgary often deals with stronger wind exposure, especially on
              elevated streets and open edge communities where gusts travel
              across less-protected rooflines. That affects shingle sealing
              performance and ridge-line wear over time. We also see many newer
              builds in the NW where ventilation details can be uneven from
              house to house: one block may have balanced intake and exhaust,
              while the next has shortfalls that accelerate heat buildup and
              moisture cycling. In practical terms, Calgary roofing scopes in
              the NW need careful attention to fastening patterns, ridge vent
              continuity, and attic airflow checks before finalizing materials.
            </p>

            <h3>NE Calgary</h3>
            <p className="homev3-copy">
              NE Calgary has higher housing density in many pockets and a wide
              mix of property ages, so conditions vary by street rather than by
              broad neighborhood label. Some homes are newer and mostly dealing
              with install-quality issues; others are older and need staged
              repairs before full replacement. Drainage design is a major factor
              in this quadrant—improperly pitched gutters or weak downspout
              routing can keep water too close to wall transitions and lower
              roof edges. For roof replacement Calgary work in the NE, install
              quality and drainage corrections are often as important as shingle
              selection itself.
            </p>

            <h3>SW Calgary</h3>
            <p className="homev3-copy">
              SW Calgary includes many older homes where insulation upgrades and
              legacy ventilation layouts do not always match current performance
              demands. That can lead to seasonal condensation concerns, ice-dam
              risk at vulnerable edges, and uneven shingle aging on different
              roof faces. SW homes also tend to include more complex rooflines
              in established neighborhoods, which increases cutting, flashing
              transitions, and labour sensitivity. A proper Calgary roofing
              scope in the SW typically includes a stronger ventilation review,
              deck-condition checks in older sections, and tighter sequencing
              around valleys and penetrations.
            </p>

            <h3>SE Calgary</h3>
            <p className="homev3-copy">
              SE Calgary has many newer communities with faster build cycles,
              and that often means builder-grade installs that perform
              adequately at first but expose weaknesses earlier than expected
              under Calgary weather. We frequently see early maintenance needs
              tied to detail execution—edge metal integration, valley treatment,
              or accessory flashing around vents and stacks. Drainage patterns
              in newer developments also matter because grading and downspout
              paths can move water aggressively during storms. For Calgary
              eavestrough and roofing planning in the SE, reliable water
              management is usually a core part of the scope, not an optional
              add-on.
            </p>

            <h2>Roofing Activity by Neighborhood</h2>
            <p className="homev3-copy">
              Neighborhood-level activity tells a more useful story than broad
              city averages. In practice, some areas show higher volume from
              aging systems—Country Hills and Crescent Heights are common
              examples where lifecycle-driven replacement demand appears
              consistently. Other areas, including Chaparral and Copperfield,
              often surface install-related issues where roof age alone does not
              explain performance. This is why we tie recommendations to real
              quote data and field observations instead of repeating generic
              scripts. When neighborhood patterns are clear, homeowners get
              faster, cleaner scope decisions and fewer surprises once work
              begins.
            </p>

            <h2>How Roofing Costs Vary Across Calgary</h2>
            <ul className="homev3-copy">
              <li>
                Roof complexity: valleys, dormers, tie-ins, and penetrations
                increase labour and detailing time.
              </li>
              <li>
                Exposure to weather: wind direction, hail history, and seasonal
                temperature swings impact material wear.
              </li>
              <li>
                Accessibility: steep pitches, limited staging space, and
                difficult access routes change project efficiency.
              </li>
              <li>
                Ventilation condition: intake/exhaust imbalance can require
                corrections beyond shingle replacement.
              </li>
              <li>
                Drainage systems: Calgary eavestrough layout and discharge
                routing affect long-term roof edge performance.
              </li>
            </ul>
            <p className="homev3-copy">
              These variables are exactly why our instant quote workflow starts
              with address context and then layers in localized roof data. It is
              built to produce a useful planning range quickly, then refine
              scope based on the real condition profile of the property.
            </p>

            <h2>Calgary Roofing Data Insights</h2>
            <p className="homev3-copy">
              The neighborhood list and quadrant heat shown above are based on
              real Calgary quote activity captured by the platform. They are
              operational signals from actual request patterns, not generic
              marketing datasets. That means service-area trends can change as
              local demand changes, and your planning context stays grounded in
              what is happening on real homes across the city.
            </p>

            <h2>Get an Instant Roofing Estimate in Calgary</h2>
            <p className="homev3-copy">
              If you want a fast baseline for Calgary roofing work, start with
              the{" "}
              <Link href="/online-estimate">instant roofing estimate tool</Link>
              . If you are comparing systems, review{" "}
              <Link href="/services/roofing">
                roof replacement Calgary service details
              </Link>
              , then evaluate water management options in our{" "}
              <Link href="/services/gutters">
                Calgary eavestrough and gutter service page
              </Link>
              . For exterior envelope upgrades beyond the roof, see{" "}
              <Link href="/services/james-hardie-siding">
                James Hardie siding installation in Calgary
              </Link>
              . Using these together gives a clearer scope and a more accurate
              budget range before you commit to scheduling.
            </p>
          </section>
        </PageContainer>
      </section>
    </>
  );
}
