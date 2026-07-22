import { notFound } from "next/navigation";
import BlogArticleTemplate from "@/components/BlogArticleTemplate";
import { getBlogArticle } from "@/lib/blogArticles";
import { isBlogPostPublished } from "@/lib/blog";
import { buildMetadata } from "@/lib/seo";

const slug = "repair-vs-replacement-calgary";
const article = getBlogArticle(slug);

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Roof Repair vs Replacement Calgary | Decision Guide",
  description: "Compare roof repair versus roof replacement in Calgary after leaks, hail, wind damage, aging shingles, or repeated repairs.",
  path: `/blog/${slug}`
});

export default function BlogPostPage() {
  if (!article || !isBlogPostPublished(slug)) notFound();
  return <BlogArticleTemplate article={article} />;
}
