import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import { getGeoPostBySlug } from "@/lib/db";
import { getPlaceholderProjectImage } from "@/lib/images";
import { buildMetadata } from "@/lib/seo";

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
  const heroImage = geoPost.heroImage ?? getPlaceholderProjectImage(geoPost.slug ?? geoPost.id);

  return (
    <>
      <PageHero
        eyebrow={geoPost.service_slug ?? "Location post"}
        title={title}
        description={`${geoPost.neighborhood ?? geoPost.city ?? "Calgary"}, ${geoPost.province ?? "AB"}`}
        actions={
          <>
            <Link href="/geo-posts" className="button">All geo posts</Link>
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
