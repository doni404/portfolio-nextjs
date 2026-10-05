"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ChevronRight } from "lucide-react";
const sections: Record<string, string> = {
  blogs: "Journal",
  automation: "Automation",
  analytics: "Analytics",
  "ai-usage": "AI Usage",
  projects: "Projects",
  experiences: "Experience",
  comments: "Comments",
  "contact-submissions": "Messages",
  assets: "Assets",
  settings: "Settings",
};
export function AdminBreadcrumbs() {
  const segments = usePathname().split("/").filter(Boolean);
  return (
      <nav className="admin-breadcrumbs" aria-label="Breadcrumb">
        <Link href="/admin">Admin</Link>
        <ChevronRight size={13} />
        {segments[2] ? <Link href={`/admin/${segments[1]}`}>{sections[segments[1]]}</Link> : <strong aria-current="page">{sections[segments[1]] ?? "Dashboard"}</strong>}
        {segments[2] && (
          <>
            <ChevronRight size={13} />
            <strong aria-current="page">{segments[2] === "new" ? "New" : "Edit"}</strong>
          </>
        )}
      </nav>
  );
}
export function AdminTopbar() {
  return (
    <header className="admin-topbar">
      <AdminBreadcrumbs />
      <Link href="/" target="_blank" rel="noopener noreferrer" className="admin-website-link">
        View website <ArrowUpRight size={15} />
      </Link>
    </header>
  );
}
