import Link from "next/link";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import ServiceSchema from "@/components/ServiceSchema";
import GeoPostCard from "@/components/GeoPostCard";
import { listGeoPosts } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Solar integration",
  description:
    "Solar-ready roofing and partner-installed solar systems through Trusted Roofing & Exteriors.",
  path: "/services/solar"
});

export default async function SolarPage() {
  const geoPosts = await listGeoPosts(6, { serviceSlugs: ["solar"] });


  return (
    <>
      <ServiceSchema serviceName="Solar integration" serviceType="Solar" />
      <PageHero
        eyebrow="Service detail"
        title="Solar integration"
        description="Roof and exterior planning aligned with partner-led solar install pathways."
        actions={<Link href="/online-estimate" className="button">Start instant quote</Link>}
      />
      <section className="ui-page-section">
        <PageContainer>
          <article className="ui-card">
            <h2>Solar-ready pathway</h2>
            <ul>
              <li>Roof condition review for panel readiness</li>
              <li>Envelope-first upgrade sequencing</li>
              <li>Partner coordination for electrical scope</li>
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

      <CtaBand title="Planning solar + roofing together?" body="Start with an exterior quote so sequencing is handled correctly." />
    </>
  );
}
