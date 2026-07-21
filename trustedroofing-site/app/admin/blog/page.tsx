import AdminTabs from "@/app/admin/_components/AdminTabs";
import BlogManager from "@/app/admin/_components/BlogManager";
import { blogArticles } from "@/lib/blogArticles";

export const dynamic = "force-dynamic";

export default function AdminBlogPage() {
  return (
    <section className="section admin-shell">
      <div className="admin-hero">
        <div>
          <p className="admin-kicker">Content management</p>
          <h1 className="hero-title">Blog management</h1>
          <p className="hero-subtitle">
            Edit scheduled SEO posts, attach hero images by upload or URL, drag sections into a new order, and preview the public HTML layout before publishing.
          </p>
        </div>
      </div>
      <AdminTabs currentPath="/admin/blog" />
      <BlogManager articles={Object.values(blogArticles)} />
    </section>
  );
}
