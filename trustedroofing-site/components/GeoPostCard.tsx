import Image from "next/image";
import Link from "next/link";
import type { ResolvedGeoPost } from "@/lib/db";
import { getPlaceholderProjectImage } from "@/lib/images";

export default function GeoPostCard({ geoPost, eagerImage = false }: { geoPost: ResolvedGeoPost; eagerImage?: boolean }) {
  const title = geoPost.title ?? geoPost.slug ?? "Project update";
  const markdownLinkMatch = (geoPost.content ?? "").match(/\[([^\]]+)\]\(([^)]+)\)/);
  const selectedAnchorText = markdownLinkMatch?.[1]?.trim() || "View related project";
  const href = markdownLinkMatch?.[2]?.trim() || null;
  const heroImage = geoPost.heroImage ?? getPlaceholderProjectImage({
    seed: geoPost.slug ?? geoPost.id,
    neighborhood: geoPost.neighborhood,
    city: geoPost.city
  });
  const excerpt = (geoPost.summary ?? "Published location-backed project update.").slice(0, 160);
  const publishedLabel = geoPost.published_at
    ? new Date(geoPost.published_at).toLocaleDateString("en-CA")
    : null;

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
            loading={eagerImage ? "eager" : "lazy"}
          />
          <div className="seo-card__content">
            <span className="ui-pill">{geoPost.service_slug ?? "project"}</span>
            <h3>{title}</h3>
            <p>{geoPost.neighborhood ?? geoPost.city ?? "Calgary"}, {geoPost.province ?? "AB"}</p>
            {publishedLabel ? <p>Job date: {publishedLabel}</p> : null}
            <p>{excerpt}{excerpt.length >= 160 ? "…" : ""}</p>
            <span className="quote-card__cta">{selectedAnchorText}</span>
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
            loading={eagerImage ? "eager" : "lazy"}
          />
          <span className="ui-pill">{geoPost.service_slug ?? "project"}</span>
          <h3>{title}</h3>
          <p>{geoPost.neighborhood ?? geoPost.city ?? "Calgary"}, {geoPost.province ?? "AB"}</p>
          {publishedLabel ? <p>Job date: {publishedLabel}</p> : null}
          <p>{excerpt}{excerpt.length >= 160 ? "…" : ""}</p>
        </>
      )}
    </article>
  );
}
