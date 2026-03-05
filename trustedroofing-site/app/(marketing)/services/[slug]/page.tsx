import Link from "next/link";
import { notFound } from "next/navigation";
import LocalBusinessSchema from "@/components/LocalBusinessSchema";
import ProjectCarousel from "@/components/ProjectCarousel";
import ServiceSchema from "@/components/ServiceSchema";
import { getServiceBySlug, listProjects } from "@/lib/db";
import { buildMetadata, canonicalUrl } from "@/lib/seo";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const service = await getServiceBySlug(params.slug);
  if (!service) {
    return buildMetadata({
      title: "Service not found",
      description: "The requested service could not be found.",
      path: `/services/${params.slug}`
    });
  }

  return buildMetadata({
    title: service.title,
    description: service.base_sales_copy ?? `Trusted ${service.title} services in Calgary.`,
    path: `/services/${service.slug}`
  });
}

export default async function ServiceHubPage({ params }: { params: { slug: string } }) {
  const service = await getServiceBySlug(params.slug);
  if (!service) return notFound();

  const recentProjects = await listProjects({ service_slug: service.slug, limit: 5 });
  const items = recentProjects.map((project) => ({
    name: project.title,
    url: canonicalUrl(`/projects/${project.slug}`)
  }));

  return (
    <section className="section">
      <LocalBusinessSchema />
      <ServiceSchema serviceName={service.title} serviceSlug={service.slug} items={items} />
      <div className="hero" style={{ gridTemplateColumns: "1fr" }}>
        <div>
          <h1 className="hero-title">{service.title}</h1>
          <p className="hero-subtitle">
            {service.base_sales_copy ??
              `Trusted Roofing & Exteriors delivers ${service.title.toLowerCase()} work across Calgary with documented real projects.`}
          </p>
          <div style={{ marginTop: 14, display: "flex", gap: 12 }}>
            <Link href="/quote" className="button">Start instant quote</Link>
            <Link href="/projects" className="button" style={{ background: "white", color: "var(--color-primary)", border: "1px solid rgba(30, 58, 138, 0.2)" }}>
              Browse all projects
            </Link>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <ProjectCarousel serviceSlug={service.slug} fallbackLabel={`Recent ${service.title.toLowerCase()} projects in Calgary`} limit={5} />
      </div>
    </section>
  );
}
