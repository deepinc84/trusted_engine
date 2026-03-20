import Link from "next/link";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import ServiceCard from "@/components/ui/ServiceCard";
import { listServices } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Services",
  description: "Roofing and exterior service hubs with real Calgary project examples.",
  path: "/services"
});

export default async function ServicesPage() {
  const services = await listServices();

  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Exterior services built for Alberta weather"
        description="Explore each service line and see how Trusted delivers project-backed exterior work across Calgary."
        actions={
          <>
            <Link href="/quote" className="button">Get an instant quote</Link>
            <Link href="/projects" className="button button--ghost">Browse projects</Link>
          </>
        }
      />

      <section className="ui-page-section">
        <PageContainer>
          <div className="ui-grid ui-grid--services">
            {services.map((service) => (
              <ServiceCard
                key={service.slug}
                slug={service.slug}
                title={service.title}
                description={service.base_sales_copy ?? "Real project-backed service delivery for Calgary homes."}
              />
            ))}
          </div>
        </PageContainer>
      </section>

      <CtaBand
        title="Need clarity on scope and price?"
        body="Start with the instant quote, then we can refine with site specifics and project photos."
      />
    </>
  );
}
