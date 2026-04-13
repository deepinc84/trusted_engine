import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import DynamicSchema from "@/components/DynamicSchema";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import { getProjectBySlug } from "@/lib/db";
import { getPlaceholderProjectImage } from "@/lib/images";
import { getNearestNeighborhoodLinksForProject } from "@/lib/seo-engine";
import { buildMetadata } from "@/lib/seo";

const STAGE_ORDER = ["before", "tear_off_prep", "installation", "after", "detail_issue"] as const;
const STAGE_LABELS: Record<(typeof STAGE_ORDER)[number], string> = {
  before: "Before",
  tear_off_prep: "Tear-off / Prep",
  installation: "Installation",
  after: "After",
  detail_issue: "Detail / Issue"
};

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const project = await getProjectBySlug(params.slug);
  if (!project) {
    return buildMetadata({
      title: "Project not found",
      description: "The requested project could not be found.",
      path: `/projects/${params.slug}`
    });
  }

  return buildMetadata({
    title: project.title,
    description: project.summary,
    path: `/projects/${project.slug}`
  });
}

export default async function ProjectDetailPage({ params }: { params: { slug: string } }) {
  const project = await getProjectBySlug(params.slug);
  if (!project) return notFound();

  const gallery = project.photos ?? [];
  const locationLabel = [project.neighborhood, project.city].filter(Boolean).join(", ") || project.city;
  const groupedGallery = STAGE_ORDER.map((stage) => ({
    stage,
    label: STAGE_LABELS[stage],
    photos: gallery.filter((photo) => (photo.stage ?? "before") === stage)
  })).filter((entry) => entry.photos.length > 0);
  const relatedNeighborhoods = await getNearestNeighborhoodLinksForProject(project, 3);

  return (
    <>
      <DynamicSchema projectData={project} relatedNeighborhoods={relatedNeighborhoods} />
      <PageHero
        eyebrow={project.service_slug}
        title={project.title}
        description={`${project.neighborhood ?? "Calgary"}, ${project.city}, ${project.province}`}
        actions={
          <>
            <Link href={`/services/${project.service_slug}`} className="button">Back to service</Link>
            <Link href="/projects" className="button button--ghost">All projects</Link>
          </>
        }
      />

      <section className="ui-page-section">
        <PageContainer>
          <article className="ui-card">
            <h2>Project summary</h2>
            <p>{project.summary}</p>
            {project.description ? <p>{project.description}</p> : null}
          </article>

          {gallery.length ? (
            <div style={{ marginTop: 18, display: "grid", gap: 20 }}>
              {groupedGallery.map((group) => (
                <section key={group.stage} style={{ display: "grid", gap: 12 }}>
                  <h3 style={{ margin: 0 }}>{group.label}</h3>
                  <div className="ui-grid ui-grid--gallery">
                    {group.photos.slice(0, 12).map((photo) => {
                      const caption = (photo.caption ?? "").trim();
                      const alt = caption
                        ? `${group.label}: ${caption}`
                        : `${group.label}: ${project.title} in ${locationLabel}`;
                      return (
                        <article className="ui-card" key={photo.id}>
                          <Image
                            src={photo.public_url}
                            alt={alt}
                            width={960}
                            height={720}
                            style={{ width: "100%", height: "auto", borderRadius: 12 }}
                          />
                          <p style={{ margin: "10px 0 6px", fontWeight: 600, fontSize: 12, letterSpacing: 0.3, textTransform: "uppercase", color: "var(--color-primary)" }}>
                            {group.label}
                          </p>
                          {caption ? <p style={{ margin: "0 0 6px" }}>{caption}</p> : null}
                          {photo.description ? <p style={{ margin: 0 }}>{photo.description}</p> : null}
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <article className="ui-card" style={{ marginTop: 18 }}>
              <Image
                src={getPlaceholderProjectImage({
                  seed: project.slug,
                  neighborhood: project.neighborhood,
                  quadrant: project.quadrant,
                  city: project.city
                })}
                alt={project.title}
                width={960}
                height={720}
                style={{ width: "100%", height: "auto", borderRadius: 12 }}
              />
            </article>
          )}
        </PageContainer>
      </section>

      <CtaBand
        title="Planning a similar project?"
        body="Get an instant quote and we can align final pricing to your specific scope."
      />
    </>
  );
}
