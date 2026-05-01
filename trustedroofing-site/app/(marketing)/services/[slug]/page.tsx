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

const serviceFamilySlugs = (slug: string) => {
  if (slug === "roofing" || slug === "roof-repair") return ["roofing", "roof-repair", "roof-replacement", "shingles"];
  if (slug === "siding" || slug === "james-hardie-siding") return ["siding", "james-hardie-siding", "vinyl-siding", "hardie-board-siding"];
  if (slug === "gutters" || slug === "eavestrough") return ["gutters", "eavestrough", "downspout", "drainage"];
  return [slug];
};

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
    listGeoPosts(24, { serviceSlugs: serviceFamilySlugs(service.slug) })
  ]);

  const recentGeoPosts = geoPosts.slice(0, 5);
  const olderGeoPosts = geoPosts.slice(5);

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

      {recentGeoPosts.length > 0 ? (
        <section className="ui-page-section">
          <PageContainer>
            <h2 className="homev3-title" style={{ marginBottom: 16 }}>
              Recent {service.title} Projects Near Calgary
            </h2>
            <div className="carousel" aria-label={`Recent ${service.title} project updates`}>
              {recentGeoPosts.map((post, index) => (
                <div key={post.id} id={`project-update-${post.id}`}>
                  <GeoPostCard geoPost={post} eagerImage={index < 2} />
                </div>
              ))}
            </div>
          </PageContainer>
        </section>
      ) : null}

      {olderGeoPosts.length > 0 ? (
        <section className="ui-page-section ui-page-section--soft">
          <PageContainer>
            <article className="ui-card">
              <h2>All Published {service.title} Project Updates</h2>
              <p className="homev3-copy">Older published updates remain discoverable here for homeowners and search engines.</p>
              <div className="ui-list-links">
                {olderGeoPosts.map((post) => (
                  <article key={post.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--ui-border)" }}>
                    <h3 style={{ marginBottom: 4 }}>
                      <Link href={`/services/${service.slug}#project-update-${post.id}`}>{post.title ?? "Project update"}</Link>
                    </h3>
                    <p style={{ margin: 0 }}>{post.summary ?? "Published location-backed project update."}</p>
                  </article>
                ))}
              </div>
            </article>
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
