import { permanentRedirect } from "next/navigation";
import { getGeoPostBySlug } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Project updates",
  description: "Project updates are available on service pages.",
  path: "/geo-posts",
  robots: {
    index: false,
    follow: true
  }
});

export default async function GeoPostDetailPage({ params }: { params: { slug: string } }) {
  const geoPost = await getGeoPostBySlug(params.slug);
  if (geoPost?.service_slug) {
    permanentRedirect(`/services/${geoPost.service_slug}`);
  }
  permanentRedirect("/projects");
}
