import Link from "next/link";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import ServiceSchema from "@/components/ServiceSchema";
<<<<<<< codex/fix-geo-post-visibility-issue-xwqmdd
import ServiceGeoPosts from "@/components/ServiceGeoPosts";
=======
import GeoPostCard from "@/components/GeoPostCard";
>>>>>>> main
import { listGeoPosts } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";

const faqs = [
  { question: "How much does eavestrough replacement cost in Calgary?", answer: "Pricing depends on linear footage, height, roofline complexity, downspout count, access, and whether the right system is 5-inch or 6-inch. The quote tool gives an early range, then measurements confirm the final scope." },
  { question: "Should I choose 5-inch or 6-inch gutters?", answer: "Many homes perform well with 5-inch systems, but 6-inch gutters make sense when roof area, valley concentration, slope, or runoff volume are pushing the limits of a smaller profile. The right answer is based on the house, not a blanket rule." },
  { question: "Why do my gutters overflow even after cleaning?", answer: "Overflow is not always a debris problem. Poor slope, undersized runs, bad downspout placement, crushed sections, or heavy valley discharge can all overwhelm the system." },
  { question: "Can bad gutters damage siding or the foundation?", answer: "Yes. Mismanaged roof runoff can saturate walls, stain siding, erode landscaping, and dump water too close to the foundation. In winter it can also create dangerous ice near entries and walks." },
  { question: "Do you replace only the gutters, or the full drainage setup?", answer: "That depends on the house. Sometimes replacing the troughs alone is enough. Other times downspouts, extensions, fascia details, and discharge points need to be corrected at the same time for the system to work properly." },
  { question: "How long does gutter replacement take?", answer: "Many homes can be handled quickly, but access, height, weather, and the amount of drainage redesign required can extend the timeline. The important part is getting the slope and discharge right." }
];

export const metadata = buildMetadata({
  title: "Eavestrough & Gutters",
  description: "Calgary eavestrough and gutter replacement with practical drainage planning, 5-inch and 6-inch system options, and runoff control that protects the home.",
  path: "/services/gutters"
});

export default async function GuttersPage() {
  const geoPosts = await listGeoPosts(6, { serviceSlugs: ["gutters", "eavestrough", "downspout", "drainage"] });


  return (
    <>
      {/* Schema note: this page should use one primary Service schema for eavestrough and gutter work. */}
      <ServiceSchema serviceName="Eavestrough & Gutters" serviceType="Gutter service" />
      <PageHero eyebrow="Eavestrough service" title="Eavestrough and gutter systems that move water where it needs to go" description="Drainage details are easy to ignore until the water starts landing in the wrong place. Proper eavestrough sizing, slope, and downspout placement help protect siding, soffit, fascia, foundations, and walkways through Calgary rain and spring melt." actions={<Link href="/online-estimate" className="button">Start instant quote</Link>} />

      <ServiceGeoPosts geoPosts={geoPosts} />

      <section className="ui-page-section"><PageContainer><div className="ui-detail-grid"><article className="ui-card"><h2>What this service includes</h2><p>Eavestrough work is about drainage planning first and metal second. We install 5-inch and 6-inch gutter systems, review how water leaves the roof, and look for problem areas at valleys, lower roof sections, entrances, decks, and corners where winter ice or splashback tends to show up.</p><ul><li>5-inch and 6-inch gutter system options based on roof area and runoff volume.</li><li>Downspout placement review so water is carried away from the building effectively.</li><li>Coordination with fascia, soffit, siding, and roof edge details where the drainage system ties in.</li></ul></article><article className="ui-card"><h2>When homeowners usually need it</h2><p>Common signs include overflow during normal rain, repeated icing near entries, loose runs, standing water in the trough, splash marks on siding, or drainage that empties too close to the foundation. A gutter system can look mostly intact and still be failing because the sizing, slope, or discharge path is wrong.</p></article></div></PageContainer></section>
      <section className="ui-page-section ui-page-section--soft"><PageContainer><div className="ui-detail-grid"><article className="ui-card"><h2>Why sizing and layout matter</h2><p>The difference between a 5-inch and 6-inch system is not just appearance. It is about how much water has to move through the run, how concentrated that water is at valleys, and whether the downspout layout can keep up during heavy rain or sudden snow melt. Homes with larger roof planes or concentrated runoff often need more capacity than homeowners assume.</p></article><article className="ui-card"><h2>Calgary-specific considerations</h2><p>Freeze-thaw cycles are hard on drainage systems. Water that does not leave the trough properly can turn into heavy ice, stress the fasteners, and create hazardous build-up near doors and walks. Chinook swings can make these patterns worse. That is why slope, spacing, outlet placement, and runoff direction matter as much as the metal profile itself.</p></article></div></PageContainer></section>
      <section className="ui-page-section"><PageContainer><article className="ui-card"><h2>How the process works</h2><ol><li>We review the roofline and identify where the current drainage path is failing.</li><li>We measure the runs and decide whether 5-inch or 6-inch capacity is more appropriate.</li><li>We confirm downspout count and discharge points before fabrication or installation.</li><li>We install the new system with attention to slope, support, and clean transitions at fascia and roof edge details.</li><li>We verify that runoff is leaving the house properly, not just dropping beside it.</li></ol></article></PageContainer></section>
      <section className="ui-page-section ui-page-section--soft"><PageContainer><article className="ui-card"><h2>Related references</h2><p>For broader guidance on roof drainage components and accessory planning, review the manufacturer information from <a href="https://www.gaf.ca/" target="_blank" rel="noreferrer">GAF</a>. Then compare that information against how your own roofline sheds water in real storms.</p></article></PageContainer></section>
      <section className="ui-page-section"><PageContainer><article className="ui-card"><h2>Frequently asked questions</h2>{/* Schema note: apply FAQ schema to this section only. */}<div className="ui-list-links" style={{ display: "grid", gap: 20 }}>{faqs.map((item) => <div key={item.question}><h3>{item.question}</h3><p>{item.answer}</p></div>)}</div></article></PageContainer></section>

<<<<<<< codex/fix-geo-post-visibility-issue-xwqmdd
      

=======
      {geoPosts.length > 0 ? (
        <section className="ui-page-section">
          <PageContainer>
            <h2 className="homev3-title" style={{ marginBottom: 16 }}>Recent local project updates</h2>
            <div className="carousel" aria-label="Recent local project updates">
              {geoPosts.map((post, index) => (
                <GeoPostCard key={post.id} geoPost={post} eagerImage={index < 2} />
              ))}
            </div>
          </PageContainer>
        </section>
      ) : null}
>>>>>>> main

      <CtaBand title="Need to know whether the problem is capacity, slope, or age?" body="Start with the quote tool, then we can confirm measurements and drainage layout on site." />
    </>
  );
}
