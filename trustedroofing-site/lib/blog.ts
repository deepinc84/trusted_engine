import { blogArticles } from "@/lib/blogArticles";

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  publishAt: string;
  image: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "how-much-does-a-roof-replacement-cost-in-calgary-2026",
    title: "How Much Does a Roof Replacement Cost in Calgary in 2026?",
    excerpt: "Real 2026 Calgary pricing ranges, what drives quote gaps, and what a proper roof quote should include.",
    publishAt: "2026-03-25T13:00:00-06:00",
    image: "/instant-quote.png"
  },
  {
    slug: "what-wind-is-actually-doing-to-roofs-right-now",
    title: "What Wind Is Actually Doing to Roofs Right Now",
    excerpt: "A field update on current Calgary wind damage patterns across shingles, siding, soffit, gutters, and flashing.",
    publishAt: "2026-08-04T09:00:00-06:00",
    image: "/calgary-wind-damage-roof.jpeg"
  },
  ...Object.values(blogArticles).map((article) => ({
    slug: article.slug,
    title: article.title,
    excerpt: article.description,
    publishAt: article.publishAt,
    image: article.heroImage
  }))
];

export function getPublishedBlogPosts(now = new Date()) {
  return blogPosts
    .filter((post) => new Date(post.publishAt).getTime() <= now.getTime())
    .sort((a, b) => new Date(b.publishAt).getTime() - new Date(a.publishAt).getTime());
}

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}

export function isBlogPostPublished(slug: string, now = new Date()) {
  const post = getBlogPost(slug);
  return Boolean(post && new Date(post.publishAt).getTime() <= now.getTime());
}
