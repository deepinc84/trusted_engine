import Image from "next/image";
import Link from "next/link";
import type { ResolvedGeoPost } from "@/lib/db";
import { getPlaceholderProjectImage } from "@/lib/images";

export default function GeoPostCard({ geoPost, eagerImage = false }: { geoPost: ResolvedGeoPost; eagerImage?: boolean }) {
  const title = geoPost.title ?? geoPost.slug ?? "Project update";
  const markdownLinkMatch = (geoPost.content ?? "").match(/\[([^\]]+)\]\(([^)]+)\)/);
  const fallbackProjectHref = geoPost.slug ? `/projects/${geoPost.slug}` : null;
  const selectedAnchorText = markdownLinkMatch?.[1]?.trim() || "View related project";
  const href = markdownLinkMatch?.[2]?.trim() ?? fallbackProjectHref;
  const plainContent = (geoPost.content ?? "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  const heroImage = geoPost.heroImage ?? getPlaceholderProjectImage({
    seed: geoPost.slug ?? geoPost.id,
    neighborhood: geoPost.neighborhood,
    city: geoPost.city
  });
  const excerptSource = plainContent || geoPost.summary || "Published location-backed project update.";
  const excerpt = excerptSource.slice(0, 220);
  const publishedLabel = geoPost.published_at
    ? new Date(geoPost.published_at).toLocaleDateString("en-CA")
    : null;

  const cardContent = (
    <>
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
        <p>
          {geoPost.neighborhood ?? geoPost.city ?? "Calgary"},{" "}
          {geoPost.province ?? "AB"}
        </p>
        {publishedLabel ? <p>Job date: {publishedLabel}</p> : null}
        <p>{excerpt}{excerpt.length >= 160 ? "…" : ""}</p>
        {href ? <span className="quote-card__cta">{selectedAnchorText}</span> : null}
      </div>
    </>
  );

  return (
    <article className="ui-card ui-card--project seo-card card">
      {href ? (
        <Link href={href} className="seo-card--link">
          {cardContent}
        </Link>
      ) : cardContent}
    </article>
  );
}
