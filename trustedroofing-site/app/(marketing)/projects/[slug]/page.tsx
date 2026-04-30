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

function inferStageFromText(value: string): (typeof STAGE_ORDER)[number] | null {
  const normalized = value.toLowerCase();
  if (normalized.includes("after")) return "after";
  if (normalized.includes("before")) return "before";
  if (normalized.includes("install")) return "installation";
  if (normalized.includes("tear") || normalized.includes("prep")) return "tear_off_prep";
  if (normalized.includes("issue") || normalized.includes("detail")) return "detail_issue";
  return null;
}

function resolvePhotoStage(photo: { stage: string | null; caption: string | null; description: string | null }) {
  const rawStage = (photo.stage ?? "").toLowerCase();
  if (STAGE_ORDER.includes(rawStage as (typeof STAGE_ORDER)[number])) {
    if (rawStage !== "before") return rawStage as (typeof STAGE_ORDER)[number];
  }

  const inferred = inferStageFromText(`${photo.caption ?? ""} ${photo.description ?? ""}`);
  if (inferred) return inferred;
  return "before";
}

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
    photos: gallery.filter((photo) => resolvePhotoStage(photo) === stage)
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
                    {group.photos.map((photo, index) => {
                      const caption = (photo.caption ?? "").trim();
                      const imageNumber = index + 1;
                      const defaultLabel = `[${group.label}] ${project.title} image ${String(imageNumber).padStart(2, "0")}`;
                      const displayCaption = caption || defaultLabel;
                      const alt = caption
                        ? `${group.label}: ${caption}`
                        : `${group.label}: ${project.title} image ${imageNumber} in ${locationLabel}`;
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
                          <p style={{ margin: "0 0 6px" }}>{displayCaption}</p>
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
