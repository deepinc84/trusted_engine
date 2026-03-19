import GeoPostCard from "@/components/GeoPostCard";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import { listGeoPosts } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Geo posts",
  description: "Location-backed project posts with public photos and neighborhood context.",
  path: "/geo-posts"
});

export default async function GeoPostsPage() {
  const geoPosts = await listGeoPosts();

  return (
    <>
      <PageHero
        eyebrow="Locations"
        title="Geo posts"
        description="Published location-backed posts with project imagery and neighborhood context."
      />

      <section className="ui-page-section">
        <PageContainer>
          {geoPosts.length ? (
            <div className="ui-grid ui-grid--projects">
              {geoPosts.map((geoPost) => (
                <GeoPostCard key={geoPost.id} geoPost={geoPost} />
              ))}
            </div>
          ) : (
            <article className="ui-card">
              <h2>No geo posts published yet.</h2>
              <p>Publish a linked geo post from the admin area after project photos are ready.</p>
            </article>
          )}
        </PageContainer>
      </section>

      <CtaBand
        title="Need a project quote for your neighborhood?"
        body="Use instant quote to compare your home against nearby published work."
      />
    </>
  );
}
