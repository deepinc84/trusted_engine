import Image from "next/image";
import Link from "next/link";
import type { ResolvedGeoPost } from "@/lib/db";
import { getPlaceholderProjectImage } from "@/lib/images";

export default function GeoPostCard({ geoPost }: { geoPost: ResolvedGeoPost }) {
  const title = geoPost.title ?? geoPost.slug ?? "Geo post";
  const heroImage = geoPost.heroImage ?? getPlaceholderProjectImage({
    seed: geoPost.slug ?? geoPost.id,
    neighborhood: geoPost.neighborhood,
    city: geoPost.city
  });

  return (
    <article className="ui-card ui-card--project">
      <Image
        src={heroImage}
        alt={title}
        width={640}
        height={400}
        className="ui-card--project__image"
      />
      <span className="ui-pill">{geoPost.service_slug ?? "project"}</span>
      <h3>{title}</h3>
      <p>{geoPost.neighborhood ?? geoPost.city ?? "Calgary"}, {geoPost.province ?? "AB"}</p>
      <p>{geoPost.summary ?? "Published location-backed project update."}</p>
      {geoPost.slug ? <Link href={`/geo-posts/${geoPost.slug}`}>View geo-post</Link> : null}
    </article>
  );
}
