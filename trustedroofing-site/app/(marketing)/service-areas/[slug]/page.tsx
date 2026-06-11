import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import DynamicSchema from "@/components/DynamicSchema";
import ProjectCard from "@/components/ProjectCard";
import QuoteCard from "@/components/QuoteCard";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import {
  getAllNeighborhoodActivities,
  getNeighborhoodActivityBySlug,
} from "@/lib/seo-engine";
import { getPlaceholderProjectImage } from "@/lib/images";
import { buildMetadata } from "@/lib/seo";
import { normalizeNeighborhoodSlug } from "@/lib/serviceAreas";
import { buildServiceAreaNarrative } from "@/lib/serviceAreaNarratives";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const normalizedSlug = normalizeNeighborhoodSlug(params.slug);
  const area = await getNeighborhoodActivityBySlug(normalizedSlug);
  if (!area) {
    return buildMetadata({
      title: "Service area not found",
      description:
        "The requested Calgary neighborhood page could not be found.",
      path: `/service-areas/${normalizedSlug}`,
    });
  }

  return buildMetadata({
    title: `${area.neighborhood} roofing and exterior activity`,
    description: `Roofing, siding, and exterior services in ${area.neighborhood}, Calgary with local project insights, recent estimate activity, and instant quote tools.`,
    path: `/service-areas/${normalizedSlug}`,
  });
}

export default async function ServiceAreaDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const normalizedSlug = normalizeNeighborhoodSlug(params.slug);

  if (params.slug !== normalizedSlug) {
    permanentRedirect(`/service-areas/${normalizedSlug}`);
  }

  const area = await getNeighborhoodActivityBySlug(normalizedSlug);
  if (!area) return notFound();

  const relatedLinks = (await getAllNeighborhoodActivities()).filter(
    (entry) => entry.slug !== area.slug,
  );
  const cityProjectImage = relatedLinks
    .filter((entry) => entry.city.toLowerCase() === area.city.toLowerCase())
    .flatMap((entry) => entry.projects)
    .find((project) => project.photos?.[0]?.public_url)?.photos?.[0]?.public_url;
  const heroImage =
    area.projects.find((project) => project.photos?.[0]?.public_url)?.photos?.[0]
      ?.public_url ??
    area.geoPosts.find((post) => post.primary_image_url)?.primary_image_url ??
    cityProjectImage ??
    getPlaceholderProjectImage({
      seed: area.slug,
      neighborhood: area.neighborhood,
      quadrant: area.quadrant,
      city: area.city,
    });
  const narrative = buildServiceAreaNarrative({
    neighborhood: area.neighborhood,
    city: area.city,
    quadrant: area.quadrant,
    quoteCount: area.quoteCount,
    projectCount: area.projectCount,
    solarCount: area.solarActivityCount,
    geoPostCount: area.geoPostEnrichmentCount,
    quotes: area.cards,
    projects: area.projects,
    geoPosts: area.geoPosts,
    solarAnalyses: area.solarAnalyses,
    nearbyAreas: relatedLinks,
  });

  return (
    <>
      <DynamicSchema quoteData={area} relatedNeighborhoods={relatedLinks} />
      <PageHero
        eyebrow={`${area.city} service area`}
        title={`Roofing in ${area.neighborhood}, ${area.city}`}
        description={`See local roofing, siding, and eavestrough estimate activity in ${area.neighborhood}, then start an instant quote for your own property.`}
        image={heroImage}
        imageAlt={`Roofing project serving ${area.neighborhood}, ${area.city}`}
      />

      <section className="ui-page-section">
        <PageContainer>
          <div className="service-area-shell">
            <article className="ui-card">
              <h2>{narrative.headline}</h2>
              <p className="homev3-copy">{narrative.summary}</p>
              <p className="homev3-copy">{narrative.activityContext}</p>
              {narrative.roofContext ? (
                <p className="homev3-copy">{narrative.roofContext}</p>
              ) : null}
              {narrative.solarContext ? (
                <p className="homev3-copy">{narrative.solarContext}</p>
              ) : null}
              {relatedLinks.length ? (
                <p className="homev3-copy">
                  Related active areas include{" "}
                  {relatedLinks.map((entry, index) => (
                    <span key={entry.slug}>
                      <Link href={`/service-areas/${entry.slug}`}>
                        {entry.neighborhood}
                      </Link>
                      {index < relatedLinks.length - 1 ? ", " : "."}
                    </span>
                  ))}
                </p>
              ) : null}
            </article>

            <article className="ui-card">
              <h2>Activity source snapshot</h2>
              <p className="homev3-copy">
                {area.quoteCount} quote signal{area.quoteCount === 1 ? "" : "s"}{" "}
                · {area.projectCount} published project
                {area.projectCount === 1 ? "" : "s"} · {area.solarActivityCount}{" "}
                solar model{area.solarActivityCount === 1 ? "" : "s"}
                {area.has_geo_post_enrichment
                  ? ` · ${area.geoPostEnrichmentCount} project-derived local update${area.geoPostEnrichmentCount === 1 ? "" : "s"}`
                  : ""}
              </p>
              <p className="homev3-copy">
                Average quote range:{" "}
                {area.averageLow
                  ? `$${area.averageLow.toLocaleString()}`
                  : "N/A"}{" "}
                -{" "}
                {area.averageHigh
                  ? `$${area.averageHigh.toLocaleString()}`
                  : "N/A"}
                .
              </p>
            </article>
          </div>

          {area.cards.length ? (
            <div className="quote-card-grid" style={{ marginTop: 20 }}>
              {area.cards.slice(0, 6).map((card) => (
                <QuoteCard key={card.id} quote={card} variant="compact" />
              ))}
            </div>
          ) : null}

          {area.projects.length ? (
            <div style={{ marginTop: 28 }}>
              <h2 className="homev3-title" style={{ fontSize: "2rem" }}>
                Related projects in {area.neighborhood}
              </h2>
              <div
                className="ui-grid ui-grid--projects"
                style={{ marginTop: 18 }}
              >
                {area.projects.slice(0, 6).map((project) => (
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
