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
  const serviceCards = services.flatMap((service) => {
    if (service.slug !== "siding") return [service];

    return [
      {
        ...service,
        title: "Vinyl Siding Service",
        base_sales_copy: "Vinyl siding replacement focused on trim, flashing, and clean finish details."
      },
      {
        ...service,
        id: `${service.id}-hardie`,
        slug: "james-hardie-siding",
        title: "James Hardie siding Calgary",
        base_sales_copy: "Fiber cement siding for homeowners who want a heavier finish and a more architectural exterior."
      }
    ];
  });

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
            {serviceCards.map((service) => (
              <ServiceCard
                key={service.slug}
                slug={service.slug}
                title={service.title}
                description={service.base_sales_copy ?? "Real project-backed service delivery for Calgary homes."}
              />
            ))}
          </div>

          <article className="ui-card" style={{ marginTop: 24 }}>
            <h2>Compare siding directions</h2>
            <p className="homev3-copy">
              Homeowners usually end up comparing budget, wall condition, and the finished look. If you want the heavier
              fiber cement option, review <Link href="/services/james-hardie-siding">James Hardie siding Calgary</Link>.
              If budget control matters more, the vinyl siding page breaks down where that system usually makes more sense.
            </p>
          </article>
        </PageContainer>
      </section>

      <CtaBand
        title="Need clarity on scope and price?"
        body="Start with the instant quote, then we can refine with site specifics and project photos."
      />
    </>
  );
}
