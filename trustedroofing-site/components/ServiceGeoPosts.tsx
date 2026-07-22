"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ResolvedGeoPost } from "@/lib/db";
import PageContainer from "@/components/ui/PageContainer";
import { getPlaceholderProjectImage } from "@/lib/images";

const BATCH_SIZE = 10;
const AUTO_SCROLL_INTERVAL_MS = 4500;

function projectLinkFromContent(content: string | null): { href: string; text: string } | null {
  if (!content) return null;
  const match = content.match(/\[([^\]]+)\]\(([^)]+)\)/);
  if (!match) return null;
  return { text: match[1].trim(), href: match[2].trim() };
}

function cleanContent(content: string | null): string {
  return (content ?? "").replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1").trim();
}

export default function ServiceGeoPosts({ geoPosts, heading }: { geoPosts: ResolvedGeoPost[]; heading?: string }) {
  const sectionId = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  const [visibleBatchEnd, setVisibleBatchEnd] = useState(Math.min(BATCH_SIZE, geoPosts.length));
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);

  if (geoPosts.length === 0) return null;

  const geoJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: heading ?? "Recent roof replacements",
    itemListElement: geoPosts
      .filter((post) => post.lat_public !== null && post.lng_public !== null)
      .map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "BlogPosting",
          headline: post.title ?? "Roof replacement update",
          url: post.slug ? `/projects/${post.slug}` : "/projects",
          datePublished: post.published_at ?? post.created_at,
          contentLocation: {
            "@type": "Place",
            name: [post.neighborhood, post.city, post.province].filter(Boolean).join(", "),
            geo: {
              "@type": "GeoCoordinates",
              latitude: post.lat_public,
              longitude: post.lng_public,
            },
          },
        },
      })),
  };

  const scrollToPost = (index: number, { focus = false }: { focus?: boolean } = {}) => {
    window.requestAnimationFrame(() => {
      const nextCard = trackRef.current?.querySelector<HTMLElement>(`[data-geo-post-index="${index}"]`);
      nextCard?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
      if (focus) nextCard?.focus({ preventScroll: true });
    });
  };

  useEffect(() => {
    if (geoPosts.length <= 1 || isAutoScrollPaused) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => {
        const nextIndex = (currentIndex + 1) % geoPosts.length;
        setVisibleBatchEnd((currentEnd) => Math.max(currentEnd, Math.min(nextIndex + 1, geoPosts.length)));
        scrollToPost(nextIndex);
        return nextIndex;
      });
    }, AUTO_SCROLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [geoPosts.length, isAutoScrollPaused]);

  const handleLoadMore = () => {
    const previousEnd = visibleBatchEnd;
    const nextEnd = Math.min(previousEnd + BATCH_SIZE, geoPosts.length);
    setVisibleBatchEnd(nextEnd);
    setActiveIndex(previousEnd);
    scrollToPost(previousEnd, { focus: true });
  };

  return (
    <section className="ui-page-section" id={sectionId}>
      <PageContainer>
        <article className="ui-card service-geo-posts">
          <div className="service-geo-posts__header">
            <div>
              <h2>{heading ?? "Recent roof replacements"}</h2>
              <p>Swipe or let the carousel auto-scroll through recent location-backed project updates. All posts are rendered in the page source for crawlable project discovery.</p>
            </div>
            <span>{geoPosts.length} update{geoPosts.length === 1 ? "" : "s"}</span>
          </div>

          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(geoJsonLd) }}
          />

          <div
            ref={trackRef}
            className="service-geo-posts__carousel"
            aria-label={heading ?? "Recent roof replacements"}
            onMouseEnter={() => setIsAutoScrollPaused(true)}
            onMouseLeave={() => setIsAutoScrollPaused(false)}
            onFocus={() => setIsAutoScrollPaused(true)}
            onBlur={() => setIsAutoScrollPaused(false)}
          >
            {geoPosts.map((post, index) => {
              const title = post.title ?? post.slug ?? "Project update";
              const fullPostHref = post.slug ? `/projects/${post.slug}` : "/projects";
              const projectLink = projectLinkFromContent(post.content);
              const heroImage =
                post.heroImage ??
                getPlaceholderProjectImage({ seed: post.slug ?? post.id, neighborhood: post.neighborhood, city: post.city });
              const isBeyondCurrentBatch = index >= visibleBatchEnd;

              return (
                <article
                  key={post.id}
                  id={`project-update-${post.id}`}
                  className="service-geo-posts__card"
                  data-geo-post-index={index}
                  data-upcoming={isBeyondCurrentBatch ? "true" : undefined}
                  aria-current={activeIndex === index ? "true" : undefined}
                  tabIndex={-1}
                >
                  <Image src={heroImage} alt={title} width={520} height={300} className="service-geo-posts__image" loading={index < 2 ? "eager" : "lazy"} />
                  <div className="service-geo-posts__body">
                    <h3>{title}</h3>
                    <p className="service-geo-posts__location">
                      {post.neighborhood ?? post.city ?? "Calgary"}, {post.province ?? "AB"}
                    </p>
                    <p>{cleanContent(post.content) || post.summary || "Published project update."}</p>
                    <div className="service-geo-posts__links">
                      <Link href={fullPostHref}>Open full project update</Link>
                      <Link href={projectLink?.href ?? "/projects"}>{projectLink?.text ?? "Related project"}</Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {visibleBatchEnd < geoPosts.length ? (
            <div className="service-geo-posts__footer">
              <button type="button" className="button" onClick={handleLoadMore}>
                Load 10 more project updates
              </button>
              <p>Showing first {visibleBatchEnd} in the carousel. The remaining {geoPosts.length - visibleBatchEnd} are still present in the page source and carousel track.</p>
            </div>
          ) : null}
        </article>
      </PageContainer>
    </section>
  );
}
