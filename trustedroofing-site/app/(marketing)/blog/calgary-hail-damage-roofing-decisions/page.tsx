import { notFound } from "next/navigation";
import BlogArticleTemplate from "@/components/BlogArticleTemplate";
import { getBlogArticle } from "@/lib/blogArticles";
import { isBlogPostPublished } from "@/lib/blog";
import { buildMetadata } from "@/lib/seo";

const slug = "calgary-hail-damage-roofing-decisions";
const article = getBlogArticle(slug);

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Calgary Hail Damage Roofing | Repair or Replace",
  description: "A Calgary homeowner guide to hail damage roofing decisions, documentation, repairs, exterior damage, and when replacement makes sense.",
  path: `/blog/${slug}`
});

export default function BlogPostPage() {
  if (!article || !isBlogPostPublished(slug)) notFound();
  return <BlogArticleTemplate article={article} />;
}
