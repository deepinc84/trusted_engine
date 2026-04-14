import Image from "next/image";
import Link from "next/link";
import type { ResolvedGeoPost } from "@/lib/db";
import { getPlaceholderProjectImage } from "@/lib/images";

export default function GeoPostCard({ geoPost }: { geoPost: ResolvedGeoPost }) {
  const title = geoPost.title ?? geoPost.slug ?? "Geo post";
  const href = geoPost.slug ? `/geo-posts/${geoPost.slug}` : null;
  const heroImage = geoPost.heroImage ?? getPlaceholderProjectImage({
    seed: geoPost.slug ?? geoPost.id,
    neighborhood: geoPost.neighborhood,
    city: geoPost.city
  });

  return (
    <article className="ui-card ui-card--project seo-card">
      {href ? (
        <Link href={href} className="seo-card--link">
          <Image
            src={heroImage}
            alt={title}
            width={640}
            height={400}
            className="ui-card--project__image"
          />
          <div className="seo-card__content">
            <span className="ui-pill">{geoPost.service_slug ?? "project"}</span>
            <h3>{title}</h3>
            <p>{geoPost.neighborhood ?? geoPost.city ?? "Calgary"}, {geoPost.province ?? "AB"}</p>
            <p>{geoPost.summary ?? "Published location-backed project update."}</p>
            <span className="quote-card__cta">Read this update</span>
          </div>
        </Link>
      ) : (
        <>
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
        </>
      )}
    </article>
  );
}
