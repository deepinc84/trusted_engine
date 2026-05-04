import Link from "next/link";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import ServiceSchema from "@/components/ServiceSchema";
import ServiceGeoPosts from "@/components/ServiceGeoPosts";
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

      <ServiceGeoPosts geoPosts={geoPosts} />

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

      


      <CtaBand title="Planning solar + roofing together?" body="Start with an exterior quote so sequencing is handled correctly." />
    </>
  );
}
