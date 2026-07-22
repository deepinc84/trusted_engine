import { notFound } from "next/navigation";
import BlogArticleTemplate from "@/components/BlogArticleTemplate";
import { getBlogArticle } from "@/lib/blogArticles";
import { isBlogPostPublished } from "@/lib/blog";
import { buildMetadata } from "@/lib/seo";

const slug = "eavestrough-replacement-cost-calgary";
const article = getBlogArticle(slug);

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Eavestrough Replacement Cost Calgary",
  description: "Understand what affects eavestrough replacement cost in Calgary, including footage, downspouts, fascia, soffit, access, and storm damage.",
  path: `/blog/${slug}`
});

export default function BlogPostPage() {
  if (!article || !isBlogPostPublished(slug)) notFound();
  return <BlogArticleTemplate article={article} />;
}
