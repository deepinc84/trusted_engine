import Link from "next/link";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import ServiceSchema from "@/components/ServiceSchema";
import GeoPostCard from "@/components/GeoPostCard";
import { listGeoPosts } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Roof repair",
  description: "Emergency and preventative roof repair services.",
  path: "/services/roof-repair"
});

export default async function RoofRepairPage() {
  const geoPosts = await listGeoPosts(6, { serviceSlugs: ["roofing", "roof-repair", "roof-replacement", "shingles"] });


  return (
    <>
      <ServiceSchema serviceName="Roof repair" serviceType="Roof repair" />
      <PageHero
        eyebrow="Service detail"
        title="Roof repair"
        description="Fast diagnostics and repair scopes for leaks, storm issues, and maintenance fixes."
        actions={<Link href="/online-estimate" className="button">Start instant quote</Link>}
      />
      <section className="ui-page-section">
        <PageContainer>
          <article className="ui-card">
            <h2>Repair focus</h2>
            <ul>
              <li>Same-day response options where available</li>
              <li>Leak tracing with photo documentation</li>
              <li>Clear repair-vs-replacement guidance</li>
            </ul>
          </article>
        </PageContainer>
      </section>

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

      <CtaBand title="Need urgent repair pricing?" body="Start with instant quote and we can triage next steps quickly." />
    </>
  );
}
