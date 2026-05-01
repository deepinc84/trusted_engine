import Link from "next/link";
import { notFound } from "next/navigation";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import ServiceCard from "@/components/ui/ServiceCard";
import GeoPostCard from "@/components/GeoPostCard";
import ServiceSchema from "@/components/ServiceSchema";
import { getServiceBySlug, listGeoPosts, listProjects, listServices } from "@/lib/db";
import { buildMetadata, canonicalUrl } from "@/lib/seo";

const benefits = [
  "Scope clarity before install starts",
  "Built for Calgary freeze-thaw + hail cycles",
  "Project documentation and image-backed updates"
];

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

  const [recentProjects, allServices, geoPosts] = await Promise.all([
    listProjects({ service_slug: service.slug, limit: 3 }),
    listServices(),
    listGeoPosts(60)
  ]);

  const serviceFamily = (slug: string) => {
    if (slug === "roofing" || slug === "roof-repair") return "roofing";
    if (slug === "siding" || slug === "james-hardie-siding") return "siding";
    if (slug === "gutters" || slug === "eavestrough") return "gutters";
    return slug;
  };

  const targetFamily = serviceFamily(service.slug);
  const matchingGeoPosts = geoPosts
    .filter((post) => !!post.service_slug && serviceFamily(post.service_slug) === targetFamily)
    .slice(0, 8);

  const related = allServices.filter((item) => item.slug !== service.slug).slice(0, 3);

  const items = recentProjects.map((project) => ({
    name: project.title,
    url: canonicalUrl(`/projects/${project.slug}`)
  }));

  return (
    <>
      <ServiceSchema serviceName={service.title} serviceSlug={service.slug} items={items} />

      <PageHero
        eyebrow="Service detail"
        title={service.title}
        description={service.base_sales_copy ?? `Trusted delivers ${service.title.toLowerCase()} services across Calgary.`}
        actions={<Link href="/online-estimate" className="button">Start instant quote</Link>}
      />

      <section className="ui-page-section">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>What to expect</h2>
              <p>
                We keep each project scope transparent, document decisions, and align install sequencing
                around weather and access constraints.
              </p>
              <ul>
                {benefits.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
            </article>

            <article className="ui-card">
              <h2>Recent {service.title.toLowerCase()} projects</h2>
              <div className="ui-list-links">
                {recentProjects.length ? recentProjects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.slug}`}>
                    {project.title}
                  </Link>
                )) : <p>No published projects yet for this service.</p>}
              </div>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section ui-page-section--soft">
        <PageContainer>
          <h2 className="homev3-title">Related services</h2>
          <div className="ui-grid ui-grid--services">
            {related.map((item) => (
              <ServiceCard
                key={item.slug}
                slug={item.slug}
                title={item.title}
                description={item.base_sales_copy ?? "Exterior service backed by project data."}
              />
            ))}
          </div>
        </PageContainer>
      </section>

      {matchingGeoPosts.length > 0 ? (
        <section className="ui-page-section">
          <PageContainer>
            <h2 className="homev3-title" style={{ marginBottom: 16 }}>
              Recent {service.title} Projects Near Calgary
            </h2>
            <div className="carousel" aria-label={`Recent ${service.title} geo-posts`}>
              {matchingGeoPosts.map((post) => (
                <GeoPostCard key={post.id} geoPost={post} />
              ))}
            </div>
          </PageContainer>
        </section>
      ) : null}

      <CtaBand
        title="Ready to price your project?"
        body="Get an instant estimate and then refine the final scope with our team."
      />
    </>
  );
}
