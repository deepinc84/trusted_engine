import { notFound } from "next/navigation";
import BlogArticleTemplate from "@/components/BlogArticleTemplate";
import { getBlogArticle } from "@/lib/blogArticles";
import { isBlogPostPublished } from "@/lib/blog";
import { buildMetadata } from "@/lib/seo";

const slug = "what-should-a-calgary-roof-quote-include";
const article = getBlogArticle(slug);

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Calgary Roof Quote Checklist | What to Compare",
  description: "Use this Calgary roof quote checklist to compare measurements, materials, ventilation, flashing, warranty, cleanup, and quote exclusions.",
  path: `/blog/${slug}`
});

export default function BlogPostPage() {
  if (!article || !isBlogPostPublished(slug)) notFound();
  return <BlogArticleTemplate article={article} />;
}
