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
import {
  getPlaceholderProjectImage,
  selectHeroProjectImage,
} from "@/lib/images";
import { buildMetadata } from "@/lib/seo";
import { normalizeNeighborhoodSlug } from "@/lib/serviceAreas";
import { buildServiceAreaNarrative } from "@/lib/serviceAreaNarratives";
import { getServiceAreaInternalLinkCards } from "@/lib/serviceAreaInternalLinks";

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

  const location = `${area.neighborhood}, ${area.city}`;
  const title =
    area.city === "Calgary"
      ? `Roofing in ${area.neighborhood} Calgary | Trusted`
      : `Roofing in ${area.neighborhood} | Trusted`;

  return buildMetadata({
    title,
    description: `Get a roofing, siding, or eavestrough estimate in ${location}. See local estimate activity, related projects, and start an instant quote online.`,
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
  const cityProjectImage = selectHeroProjectImage(
    relatedLinks
      .filter((entry) => entry.city.toLowerCase() === area.city.toLowerCase())
      .flatMap((entry) => entry.projects),
  );
  const heroImage =
    selectHeroProjectImage(area.projects) ??
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
  const serviceCards = getServiceAreaInternalLinkCards(area);
  const localizedServiceHeading =
    area.city === "Calgary"
      ? `Roofing and exterior services in ${area.neighborhood}`
      : `Roofing and exterior services in ${area.neighborhood}, ${area.city}`;

  return (
    <>
      <DynamicSchema quoteData={area} relatedNeighborhoods={relatedLinks} />
      <PageHero
        eyebrow={`${area.city} service area`}
        title={
          area.city === "Calgary"
            ? `Residential Roofing in ${area.neighborhood}, Calgary`
            : `Roofing in ${area.neighborhood}, ${area.city}`
        }
        description={`See recent roofing, siding, and eavestrough estimate activity in ${area.neighborhood}, then start an instant quote for your own property.`}
        actions={
          <>
            <Link href="/online-estimate" className="button">
              Get instant quote
            </Link>
            <Link href="/projects" className="button button--ghost">
              View projects
            </Link>
          </>
        }
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
              <h2>Local estimate snapshot</h2>
              <p className="homev3-copy">
                {area.quoteCount} estimate{area.quoteCount === 1 ? "" : "s"}{" "}
                · {area.projectCount} published project
                {area.projectCount === 1 ? "" : "s"} · {area.solarActivityCount}{" "}
                roof assessment{area.solarActivityCount === 1 ? "" : "s"}
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

          <section style={{ marginTop: 24 }}>
            <div className="ui-card" style={{ marginBottom: 16 }}>
              <h2>{localizedServiceHeading}</h2>
              <p className="homev3-copy">
                Trusted Roofing & Exteriors helps {area.neighborhood} homeowners
                compare roofing, roof replacement, roof repair, roof inspections,
                siding, James Hardie siding, eavestrough, soffit, fascia, and
                instant estimate options without guessing at the right scope.
              </p>
            </div>

            <div className="ui-grid ui-grid--services">
              {serviceCards.map((card) => (
                <article className="ui-card" key={card.href}>
                  <h3>{card.title}</h3>
                  <p className="homev3-copy">{card.body}</p>
                  <Link href={card.href}>{card.anchor}</Link>
                </article>
              ))}
            </div>
          </section>

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
        title={`Need a roofing estimate in ${area.neighborhood}?`}
        body="Start with an instant online estimate, then request a detailed proposal when you are ready."
      />
    </>
  );
}
