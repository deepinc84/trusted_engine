import Link from "next/link";
import type { HomeService } from "./types";

export default function ServicesGrid({ services }: { services: HomeService[] }) {
  return (
    <section className="homev3-section homev3-section--soft" id="services">
      <div className="homev3-container">
        <p className="homev3-eyebrow homev3-eyebrow--dark">What we do</p>
        <h2 className="homev3-title">Exterior services built for Alberta weather</h2>
        <div className="homev3-services-grid">
          {services.map((service) => (
            <article key={service.slug} className="homev3-service-card">
              <h3>{service.title}</h3>
              <p>{service.copy}</p>
              <Link href={`/services/${service.slug}`}>Learn more about {service.title}</Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
