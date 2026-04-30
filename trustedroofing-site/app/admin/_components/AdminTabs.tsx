import Link from "next/link";

type AdminTab = {
  href: string;
  label: string;
};

const adminTabs: AdminTab[] = [
  { href: "/admin", label: "Projects" },
  { href: "/admin/projects/new", label: "Create project" },
  { href: "/admin/geo-posts", label: "Geo-post management" },
  { href: "/admin/instant-quotes", label: "Instant quote dashboard" },
  { href: "/admin/actuals", label: "Actuals" },
  { href: "/admin/reports", label: "Reporting" }
];

export default function AdminTabs({ currentPath }: { currentPath: string }) {
  return (
    <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 10 }}>
      {adminTabs.map((tab) => {
        const isActive = currentPath === tab.href || currentPath.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={isActive ? "button" : "button button--ghost"}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
