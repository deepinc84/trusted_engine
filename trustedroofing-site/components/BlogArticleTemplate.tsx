import Link from "next/link";
import Image from "next/image";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import { canonicalUrl } from "@/lib/seo";
import styles from "@/app/(marketing)/blog/how-much-does-a-roof-replacement-cost-in-calgary-2026/page.module.css";

export type BlogSection = {
  heading: string;
  body: string[];
  bullets?: string[];
  links?: Array<{ href: string; label: string }>;
  image?: { src: string; alt: string; caption?: string };
};

export type BlogArticleData = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  publishAt: string;
  updatedAt?: string;
  heroImage: string;
  heroAlt: string;
  primaryCta: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  sections: BlogSection[];
};

function buildBlogSchema(article: BlogArticleData) {
  const url = canonicalUrl(`/blog/${article.slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    datePublished: article.publishAt,
    dateModified: article.updatedAt ?? article.publishAt,
    author: { "@type": "Organization", name: "Trusted Roofing & Exteriors" },
    publisher: { "@type": "Organization", name: "Trusted Roofing & Exteriors" },
    mainEntityOfPage: url,
    url,
    image: [canonicalUrl(article.heroImage)]
  };
}

export default function BlogArticleTemplate({ article }: { article: BlogArticleData }) {
  const schema = buildBlogSchema(article);
  const published = new Date(article.publishAt).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "" },
          { name: "Blog", path: "/blog" },
          { name: article.title, path: `/blog/${article.slug}` }
        ]}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className={styles.hero}>
        <div className={styles.shell}>
          <p className={styles.eyebrow}>{article.eyebrow}</p>
          <h1 className={styles.title}>{article.title}</h1>
          <p className={styles.copy} style={{ marginTop: 12, maxWidth: 760 }}>{article.description}</p>
          <p style={{ color: "var(--ink-500)", fontSize: 14, marginTop: 10 }}>Published {published}</p>
          <div className={styles.heroActions}>
            <Link href={article.primaryCta.href} className="button">{article.primaryCta.label}</Link>
            {article.secondaryCta ? <Link href={article.secondaryCta.href} className="button button--ghost">{article.secondaryCta.label}</Link> : null}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.heroImageWrap}>
            <Image className={styles.heroImage} src={article.heroImage} alt={article.heroAlt} width={1240} height={620} priority />
          </div>
          <article style={{ maxWidth: 860, margin: "0 auto", fontSize: 17, lineHeight: 1.75 }}>
            {article.sections.map((section) => (
              <section key={section.heading} style={{ marginBottom: 42 }}>
                {section.image ? (
                  <figure style={{ margin: "0 0 22px" }}>
                    <Image className={styles.inlineImage} src={section.image.src} alt={section.image.alt} width={860} height={420} />
                    {section.image.caption ? <figcaption className={styles.imgCap}>{section.image.caption}</figcaption> : null}
                  </figure>
                ) : null}
                <h2 style={{ fontSize: 30, marginBottom: 12 }}>{section.heading}</h2>
                {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets ? <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
                {section.links ? (
                  <p>
                    {section.links.map((link, index) => (
                      <span key={link.href}>
                        {index > 0 ? " · " : ""}<Link href={link.href}>{link.label}</Link>
                      </span>
                    ))}
                  </p>
                ) : null}
              </section>
            ))}
          </article>
        </div>
      </section>
    </>
  );
}
