import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProjectSchema from "@/components/ProjectSchema";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import { getGeoPostBySlug } from "@/lib/db";
import { getPlaceholderProjectImage } from "@/lib/images";
import { buildMetadata } from "@/lib/seo";

function renderLinkedContent(content: string) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const nodes: Array<string | JSX.Element> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(content)) !== null) {
    const [fullMatch, anchorText, href] = match;
    if (match.index > lastIndex) nodes.push(content.slice(lastIndex, match.index));
    nodes.push(
      <Link key={`${href}-${match.index}`} href={href} className="button button--ghost" style={{ marginRight: 8 }}>
        {anchorText}
      </Link>
    );
    lastIndex = match.index + fullMatch.length;
  }

  if (lastIndex < content.length) nodes.push(content.slice(lastIndex));
  return nodes;
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const geoPost = await getGeoPostBySlug(params.slug);
  if (!geoPost) {
    return buildMetadata({
      title: "Geo post not found",
      description: "The requested geo post could not be found.",
      path: `/geo-posts/${params.slug}`
    });
  }

  return buildMetadata({
    title: geoPost.title ?? geoPost.slug ?? "Geo post",
    description: geoPost.summary ?? "Location-backed project post.",
    path: `/geo-posts/${params.slug}`
  });
}

export default async function GeoPostDetailPage({ params }: { params: { slug: string } }) {
  const geoPost = await getGeoPostBySlug(params.slug);
  if (!geoPost) return notFound();

  const title = geoPost.title ?? geoPost.slug ?? "Geo post";
  const gallery = geoPost.gallery;
  const heroImage = geoPost.heroImage ?? getPlaceholderProjectImage({
    seed: geoPost.slug ?? geoPost.id,
    neighborhood: geoPost.neighborhood,
    city: geoPost.city
  });

  return (
    <>
      <ProjectSchema geoPost={geoPost} />
      <PageHero
        eyebrow={geoPost.service_slug ?? "Location post"}
        title={title}
        description={`${geoPost.neighborhood ?? geoPost.city ?? "Calgary"}, ${geoPost.province ?? "AB"}`}
        actions={
          <>
            <Link href="/projects" className="button">All projects</Link>
            <Link href={`/projects/${params.slug}`} className="button button--ghost">Linked project</Link>
          </>
        }
      />

      <section className="ui-page-section">
        <PageContainer>
          <article className="ui-card">
            <Image
              src={heroImage}
              alt={title}
              width={1200}
              height={800}
              style={{ width: "100%", height: "auto", borderRadius: 12 }}
            />
            {geoPost.summary ? <p style={{ marginTop: 16 }}>{geoPost.summary}</p> : null}
            {geoPost.content ? <div style={{ marginTop: 12, lineHeight: 1.6 }}>{renderLinkedContent(geoPost.content)}</div> : null}
          </article>

          {gallery.length > 1 ? (
            <div className="ui-grid ui-grid--gallery" style={{ marginTop: 18 }}>
              {gallery.slice(1, 12).map((imageUrl) => (
                <article className="ui-card" key={imageUrl}>
                  <Image
                    src={imageUrl}
                    alt={title}
                    width={960}
                    height={720}
                    style={{ width: "100%", height: "auto", borderRadius: 12 }}
                  />
                </article>
              ))}
            </div>
          ) : null}
        </PageContainer>
      </section>

      <CtaBand
        title="Planning similar work nearby?"
        body="Use instant quote to compare your scope with published local projects."
      />
    </>
  );
}
