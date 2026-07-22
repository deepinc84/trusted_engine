import { notFound } from "next/navigation";
import BlogArticleTemplate from "@/components/BlogArticleTemplate";
import { getBlogArticle } from "@/lib/blogArticles";
import { isBlogPostPublished } from "@/lib/blog";
import { buildMetadata } from "@/lib/seo";

const slug = "roof-repair-cost-calgary";
const article = getBlogArticle(slug);

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Roof Repair Cost Calgary | Repair Pricing Guide",
  description: "Learn what affects roof repair cost in Calgary, from leaks and missing shingles to flashing, vents, storm damage, access, and repair-versus-replacement decisions.",
  path: `/blog/${slug}`
});

export default function BlogPostPage() {
  if (!article || !isBlogPostPublished(slug)) notFound();
  return <BlogArticleTemplate article={article} />;
}
