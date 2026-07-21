"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";
import type { BlogArticleData, BlogSection } from "@/components/BlogArticleTemplate";

type Props = { articles: BlogArticleData[] };
type EditableSection = BlogSection & { id: string };
type EditableArticle = Omit<BlogArticleData, "sections"> & { sections: EditableSection[] };

function withIds(article: BlogArticleData): EditableArticle {
  return {
    ...article,
    sections: article.sections.map((section, index) => ({ ...section, id: `${article.slug}-${index}` }))
  };
}

function textareaList(value: string[]) {
  return value.join("\n\n");
}

function parseParagraphs(value: string) {
  return value.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
}

function parseLines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

export default function BlogManager({ articles }: Props) {
  const [selectedSlug, setSelectedSlug] = useState(articles[0]?.slug ?? "");
  const [article, setArticle] = useState<EditableArticle>(() => withIds(articles[0]));
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [status, setStatus] = useState("Draft changes save in this browser until they are copied into the content file.");

  useEffect(() => {
    const next = articles.find((item) => item.slug === selectedSlug) ?? articles[0];
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(`blog-draft:${next.slug}`) : null;
    setArticle(saved ? JSON.parse(saved) : withIds(next));
  }, [articles, selectedSlug]);

  const previewDate = useMemo(() => new Date(article.publishAt).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" }), [article.publishAt]);

  function updateArticle<K extends keyof EditableArticle>(key: K, value: EditableArticle[K]) {
    setArticle((current) => ({ ...current, [key]: value }));
  }

  function updateSection(id: string, updater: (section: EditableSection) => EditableSection) {
    setArticle((current) => ({
      ...current,
      sections: current.sections.map((section) => section.id === id ? updater(section) : section)
    }));
  }

  function addSection() {
    const id = `section-${Date.now()}`;
    setArticle((current) => ({
      ...current,
      sections: [...current.sections, { id, heading: "New section", body: ["Write the section copy here."], links: [] }]
    }));
  }

  function removeSection(id: string) {
    setArticle((current) => ({ ...current, sections: current.sections.filter((section) => section.id !== id) }));
  }

  function onDrop(targetId: string, event: DragEvent) {
    event.preventDefault();
    if (!draggedId || draggedId === targetId) return;
    setArticle((current) => {
      const sections = [...current.sections];
      const from = sections.findIndex((section) => section.id === draggedId);
      const to = sections.findIndex((section) => section.id === targetId);
      if (from < 0 || to < 0) return current;
      const [moved] = sections.splice(from, 1);
      sections.splice(to, 0, moved);
      return { ...current, sections };
    });
    setDraggedId(null);
  }

  function attachHeroFile(file: File | null) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => updateArticle("heroImage", String(reader.result));
    reader.readAsDataURL(file);
  }

  function saveDraft() {
    window.localStorage.setItem(`blog-draft:${article.slug}`, JSON.stringify(article));
    setStatus(`Saved browser draft for ${article.title}. Copy the JSON when ready to publish into lib/blogArticles.ts.`);
  }

  function copyJson() {
    const exportArticle: BlogArticleData = {
      ...article,
      sections: article.sections.map(({ id, ...section }) => section)
    };
    navigator.clipboard.writeText(JSON.stringify(exportArticle, null, 2));
    setStatus("Copied article JSON to clipboard.");
  }

  return (
    <div className="admin-blog-editor">
      <aside className="admin-blog-sidebar">
        <h2>Blog posts</h2>
        {articles.map((item) => (
          <button key={item.slug} type="button" className={item.slug === selectedSlug ? "button" : "button button--ghost"} onClick={() => setSelectedSlug(item.slug)}>
            {item.title}
          </button>
        ))}
      </aside>

      <div className="admin-blog-workspace">
        <div className="admin-blog-toolbar">
          <div>
            <p className="admin-kicker">WordPress-style editor</p>
            <h2>{article.title}</h2>
            <p className="admin-muted">Drag sections to reorder the page, edit copy inline, attach a hero by upload or URL, and preview the resulting HTML.</p>
          </div>
          <div className="admin-action-row">
            <button type="button" className="button button--ghost" onClick={addSection}>Add section</button>
            <button type="button" className="button button--ghost" onClick={copyJson}>Copy JSON</button>
            <button type="button" className="button" onClick={saveDraft}>Save draft</button>
          </div>
        </div>
        <p className="admin-muted">{status}</p>

        <div className="admin-blog-columns">
          <form className="admin-blog-form">
            <label>Title<input value={article.title} onChange={(event) => updateArticle("title", event.target.value)} /></label>
            <label>SEO description<textarea value={article.description} onChange={(event) => updateArticle("description", event.target.value)} /></label>
            <div className="admin-blog-two">
              <label>Slug<input value={article.slug} onChange={(event) => updateArticle("slug", event.target.value)} /></label>
              <label>Publish at<input value={article.publishAt} onChange={(event) => updateArticle("publishAt", event.target.value)} /></label>
            </div>
            <label>Hero image URL<input value={article.heroImage} onChange={(event) => updateArticle("heroImage", event.target.value)} /></label>
            <label>Hero image upload<input type="file" accept="image/*" onChange={(event) => attachHeroFile(event.target.files?.[0] ?? null)} /></label>
            <label>Hero alt text<input value={article.heroAlt} onChange={(event) => updateArticle("heroAlt", event.target.value)} /></label>

            <h3>Layout sections</h3>
            {article.sections.map((section) => (
              <fieldset
                key={section.id}
                draggable
                onDragStart={() => setDraggedId(section.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => onDrop(section.id, event)}
                className="admin-blog-section-card"
              >
                <legend>↕ Drag section</legend>
                <label>Heading<input value={section.heading} onChange={(event) => updateSection(section.id, (current) => ({ ...current, heading: event.target.value }))} /></label>
                <label>Paragraphs<textarea rows={6} value={textareaList(section.body)} onChange={(event) => updateSection(section.id, (current) => ({ ...current, body: parseParagraphs(event.target.value) }))} /></label>
                <label>Bullets<textarea rows={3} value={textareaList(section.bullets ?? [])} onChange={(event) => updateSection(section.id, (current) => ({ ...current, bullets: parseLines(event.target.value) }))} /></label>
                <label>Inline image URL<input value={section.image?.src ?? ""} onChange={(event) => updateSection(section.id, (current) => ({ ...current, image: event.target.value ? { src: event.target.value, alt: current.image?.alt ?? current.heading, caption: current.image?.caption } : undefined }))} /></label>
                <label>Internal links, one per line as /path | Anchor text<textarea rows={3} value={(section.links ?? []).map((link) => `${link.href} | ${link.label}`).join("\n")} onChange={(event) => updateSection(section.id, (current) => ({ ...current, links: parseLines(event.target.value).map((line) => { const [href, label] = line.split("|").map((part) => part.trim()); return { href: href || "/", label: label || href || "Link" }; }) }))} /></label>
                <button type="button" className="button button--ghost" onClick={() => removeSection(section.id)}>Remove section</button>
              </fieldset>
            ))}
          </form>

          <article className="admin-blog-preview">
            <p className="admin-kicker">HTML preview</p>
            <h1>{article.title}</h1>
            <p>{article.description}</p>
            <p className="admin-muted">Published {previewDate}</p>
            {article.heroImage ? <img src={article.heroImage} alt={article.heroAlt} /> : null}
            {article.sections.map((section) => (
              <section key={section.id}>
                {section.image?.src ? <img src={section.image.src} alt={section.image.alt} /> : null}
                <h2>{section.heading}</h2>
                {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets?.length ? <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
                {section.links?.length ? <p>{section.links.map((link) => <a key={`${section.id}-${link.href}`} href={link.href}>{link.label}</a>)}</p> : null}
              </section>
            ))}
          </article>
        </div>
      </div>
    </div>
  );
}
