import { notFound, permanentRedirect } from "next/navigation";
import DynamicSchema from "@/components/DynamicSchema";
import ProjectCard from "@/components/ProjectCard";
import QuoteCard from "@/components/QuoteCard";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import { listProjects } from "@/lib/db";
import { getAllQuoteNeighborhoods, getQuoteNeighborhoodBySlug } from "@/lib/seo-engine";
import { buildMetadata } from "@/lib/seo";
import { normalizeNeighborhoodSlug } from "@/lib/serviceAreas";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const normalizedSlug = normalizeNeighborhoodSlug(params.slug);
  const area = await getQuoteNeighborhoodBySlug(normalizedSlug);
  if (!area) {
    return buildMetadata({
      title: "Service area not found",
      description: "The requested Calgary neighborhood page could not be found.",
      path: `/service-areas/${normalizedSlug}`
    });
  }

  return buildMetadata({
    title: `${area.neighborhood} roofing quotes`,
    description: `Live quote ranges, project proof, and neighborhood-specific roofing demand for ${area.neighborhood}, Calgary.`,
    path: `/service-areas/${normalizedSlug}`
  });
}

export default async function ServiceAreaDetailPage({ params }: { params: { slug: string } }) {
  const normalizedSlug = normalizeNeighborhoodSlug(params.slug);

  if (params.slug !== normalizedSlug) {
    permanentRedirect(`/service-areas/${normalizedSlug}`);
  }

  const area = await getQuoteNeighborhoodBySlug(normalizedSlug);
  if (!area) return notFound();

  const projects = await listProjects({
    neighborhood: area.neighborhood,
    include_unpublished: false,
    limit: 6
  });

  const relatedLinks = (await getAllQuoteNeighborhoods())
    .filter((entry) => entry.slug !== area.slug)
    .slice(0, 3);

  return (
    <>
      <DynamicSchema quoteData={area} relatedNeighborhoods={relatedLinks} />
      <PageHero
        eyebrow="Neighborhood quote engine"
        title={`${area.neighborhood} roofing demand`}
        description={`Recent Calgary quote activity for ${area.neighborhood} with live pricing signals and related project proof.`}
      />

      <section className="ui-page-section">
        <PageContainer>
          <div className="service-area-shell">
            <article className="ui-card">
              <h2>Quote range snapshot</h2>
              <p className="homev3-copy">
                Average range: {area.averageLow ? `$${area.averageLow.toLocaleString()}` : "N/A"} - {area.averageHigh ? `$${area.averageHigh.toLocaleString()}` : "N/A"} across {area.quoteCount} Calgary quotes.
              </p>
            </article>
          </div>

          <div className="quote-card-grid" style={{ marginTop: 20 }}>
            {area.cards.slice(0, 6).map((card) => (
              <QuoteCard key={card.id} quote={card} />
            ))}
          </div>

          {projects.length ? (
            <div style={{ marginTop: 28 }}>
              <h2 className="homev3-title" style={{ fontSize: "2rem" }}>Related projects in {area.neighborhood}</h2>
              <div className="ui-grid ui-grid--projects" style={{ marginTop: 18 }}>
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          ) : null}
        </PageContainer>
      </section>

      <CtaBand
        title={`Need a quote in ${area.neighborhood}?`}
        body="Use instant quote to compare your property to live Calgary neighborhood pricing signals."
      />
    </>
  );
}
