import Link from "next/link";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import ServiceSchema from "@/components/ServiceSchema";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Roof repair",
  description: "Emergency and preventative roof repair services.",
  path: "/services/roof-repair"
});

export default function RoofRepairPage() {
  return (
    <>
      <ServiceSchema serviceName="Roof repair" serviceType="Roof repair" />
      <PageHero
        eyebrow="Service detail"
        title="Roof repair"
        description="Fast diagnostics and repair scopes for leaks, storm issues, and maintenance fixes."
        actions={<Link href="/quote" className="button">Start instant quote</Link>}
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
      <CtaBand title="Need urgent repair pricing?" body="Start with instant quote and we can triage next steps quickly." />
    </>
  );
}
