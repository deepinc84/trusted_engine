import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProjectSchema from "@/components/ProjectSchema";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import { getProjectBySlug } from "@/lib/db";
<<<<<<< codex/set-up-foundation-for-trustedroofing-site-bbrh8t
import { getPlaceholderProjectImage } from "@/lib/images";
=======
>>>>>>> main
import { buildMetadata } from "@/lib/seo";

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

<<<<<<< codex/set-up-foundation-for-trustedroofing-site-bbrh8t
  const gallery = project.photos ?? [];

=======
>>>>>>> main
  return (
    <>
      <ProjectSchema project={project} />
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

<<<<<<< codex/set-up-foundation-for-trustedroofing-site-bbrh8t
          {gallery.length ? (
            <div className="ui-grid ui-grid--gallery" style={{ marginTop: 18 }}>
              {gallery.slice(0, 12).map((photo) => (
                <article className="ui-card" key={photo.id}>
                  <Image
                    src={photo.public_url}
                    alt={photo.caption ?? project.title}
                    width={960}
                    height={720}
                    style={{ width: "100%", height: "auto", borderRadius: 12 }}
                  />
                  {photo.caption ? <p>{photo.caption}</p> : null}
                </article>
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
=======
          <div className="ui-grid ui-grid--gallery" style={{ marginTop: 18 }}>
            {(project.photos ?? []).slice(0, 12).map((photo) => (
              <article className="ui-card" key={photo.id}>
                <Image
                  src={photo.public_url}
                  alt={photo.caption ?? project.title}
                  width={960}
                  height={720}
                  style={{ width: "100%", height: "auto", borderRadius: 12 }}
                />
                {photo.caption ? <p>{photo.caption}</p> : null}
              </article>
            ))}
          </div>
>>>>>>> main
        </PageContainer>
      </section>

      <CtaBand
        title="Planning a similar project?"
        body="Get an instant quote and we can align final pricing to your specific scope."
      />
    </>
  );
}
