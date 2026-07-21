import { canonicalUrl } from "@/lib/seo";

export type BreadcrumbItem = {
  name: string;
  path?: string;
  url?: string;
};

export default function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const normalizedItems = items.filter((item) => item.name.trim().length > 0);

  if (normalizedItems.length < 2) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: normalizedItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url ?? canonicalUrl(item.path ?? "")
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
