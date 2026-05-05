"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ResolvedGeoPost } from "@/lib/db";
import PageContainer from "@/components/ui/PageContainer";
import { getPlaceholderProjectImage } from "@/lib/images";

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
  const [isOpen, setIsOpen] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  if (geoPosts.length === 0) return null;

  const gallery = geoPosts.slice(0, 12);

  const geoJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: heading ?? "Recent roof replacements",
    itemListElement: gallery
      .filter((post) => post.lat_public !== null && post.lng_public !== null)
      .map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "BlogPosting",
          headline: post.title ?? "Roof replacement update",
          url: post.slug ? `/geo-posts/${post.slug}` : "/projects",
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

  return (
    <section className="ui-page-section">
      <PageContainer>
        <article className="ui-card" style={{ padding: 16 }}>
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "none",
              background: "transparent",
              padding: 0,
              cursor: "pointer",
              fontWeight: 800,
              fontSize: "1.8rem",
              color: "var(--ink)",
              textAlign: "left",
            }}
            aria-expanded={isOpen}
            aria-controls="service-project-updates"
          >
            <span>{heading ?? "Recent roof replacements"}</span>
            <span style={{ color: "#1f4f96", fontSize: "1.5rem", lineHeight: 1 }}>{isOpen ? "−" : "+"}</span>
          </button>


          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(geoJsonLd) }}
          />

          {isOpen ? (
            <div id="service-project-updates" style={{ marginTop: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                {gallery.map((post) => {
                  const title = post.title ?? post.slug ?? "Project update";
                  const fullPostHref = post.slug ? `/geo-posts/${post.slug}` : "/projects";
                  const projectLink = projectLinkFromContent(post.content);
                  const heroImage =
                    post.heroImage ??
                    getPlaceholderProjectImage({ seed: post.slug ?? post.id, neighborhood: post.neighborhood, city: post.city });
                  const cardOpen = expandedCards[post.id] ?? false;

                  return (
                    <article key={post.id} className="ui-card" style={{ padding: 0, overflow: "hidden" }}>
                      <Image src={heroImage} alt={title} width={520} height={300} style={{ width: "100%", height: 160, objectFit: "cover" }} />
                      <div style={{ padding: 12, display: "grid", gap: 6 }}>
                        <h3 style={{ margin: 0, fontSize: "1.35rem", lineHeight: 1.25 }}>{title}</h3>
                        <p style={{ margin: 0, color: "#667085", fontSize: ".95rem" }}>
                          {post.neighborhood ?? post.city ?? "Calgary"}, {post.province ?? "AB"}
                        </p>
                        <button
                          type="button"
                          onClick={() => setExpandedCards((prev) => ({ ...prev, [post.id]: !cardOpen }))}
                          style={{
                            justifySelf: "start",
                            border: "none",
                            background: "#1f4f96",
                            color: "white",
                            borderRadius: 999,
                            padding: "7px 12px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {cardOpen ? "Hide details" : "View details"}
                        </button>

                        {cardOpen ? (
                          <>
                            <p style={{ margin: 0, fontSize: ".96rem" }}>{cleanContent(post.content) || post.summary || "Published project update."}</p>
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                              <Link href={fullPostHref}>Open full project update</Link>
                              <Link href={projectLink?.href ?? "/projects"}>{projectLink?.text ?? "Related project"}</Link>
                            </div>
                          </>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : null}
        </article>
      </PageContainer>
    </section>
  );
}
