import Link from "next/link";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import ServiceSchema from "@/components/ServiceSchema";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Roofing",
  description: "High-performance roof replacements and new installs.",
  path: "/services/roofing"
});

export default function RoofingPage() {
  return (
    <>
      <ServiceSchema serviceName="Roofing" serviceType="Roofing" />
      <PageHero
        eyebrow="Service detail"
        title="Roofing"
        description="Full system replacements and upgrades designed for Alberta weather cycles."
        actions={<Link href="/quote" className="button">Start instant quote</Link>}
      />
      <section className="ui-page-section">
        <PageContainer>
          <article className="ui-card">
            <h2>Roofing scope</h2>
            <ul>
              <li>Class 4 impact-resistant shingle options</li>
              <li>Ventilation and insulation alignment</li>
              <li>Image-backed project documentation</li>
            </ul>
          </article>
        </PageContainer>
      </section>
      <CtaBand title="Need a roofing estimate?" body="Use instant quote to get pricing ranges in minutes." />
    </>
  );
}
