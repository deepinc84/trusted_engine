"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";

const primary = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/estimates", label: "Estimates" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/outreach", label: "Outreach" },
  { href: "/admin/pricing-catalog", label: "Pricing Defaults" },
  { href: "/admin/roofing-systems", label: "Settings" }
];

export default function AdminTabs({ currentPath }: { currentPath?: string }) {
  const pathname=usePathname();currentPath=currentPath??pathname;
  return <nav className="admin-tabs admin-tabs--primary" aria-label="Administration">
    {primary.map(item => {
      const active = item.href === "/admin"
        ? currentPath === item.href
        : currentPath === item.href || currentPath.startsWith(`${item.href}/`);
      return <Link key={item.href} href={item.href} className={active ? "button" : "button button--ghost"} aria-current={active ? "page" : undefined}>{item.label}</Link>;
    })}
  </nav>;
}
