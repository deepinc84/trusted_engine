import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { listServices } from "@/lib/db";

export const metadata = buildMetadata({
  title: "Services",
  description: "Roofing and exterior service hubs with real Calgary project examples.",
  path: "/services"
});

export default async function ServicesPage() {
  const services = await listServices();

  return (
    <section className="section">
      <div className="hero" style={{ gridTemplateColumns: "1fr" }}>
        <div>
          <h1 className="hero-title">Service hubs</h1>
          <p className="hero-subtitle">
            Explore each service line and the real project nodes behind it.
          </p>
        </div>
      </div>

      <div className="card-grid" style={{ marginTop: 28 }}>
        {services.map((service) => (
          <article className="card" key={service.slug}>
            <h3>{service.title}</h3>
            <p style={{ color: "var(--color-muted)", marginTop: 8 }}>
              {service.base_sales_copy ?? "Real project-backed service delivery."}
            </p>
            <Link href={`/services/${service.slug}`} style={{ fontWeight: 600, marginTop: 12, display: "inline-block" }}>
              Open hub →
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
