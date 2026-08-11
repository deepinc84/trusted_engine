import Link from "next/link";
import AdminTabs from "./_components/AdminTabs";
import "./admin-app.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-app">
    <header className="admin-app__header"><Link href="/admin/estimates" className="admin-app__brand">Trusted Roofing</Link><AdminTabs /></header>
    {children}
  </div>;
}
