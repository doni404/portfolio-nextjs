"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  FolderKanban,
  Briefcase,
  MessageSquare,
  Mail,
  ImageIcon,
  Settings,
  LogOut,
  ChartNoAxesCombined, Workflow, Receipt,
} from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { cn } from "@/lib/utils";

const navItems: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { href: "/admin",                    label: "Dashboard",  icon: LayoutDashboard },
  { href: "/admin/blogs",              label: "Journal", icon: FileText },
  { href: "/admin/automation", label: "Automation", icon: Workflow },
  { href: "/admin/analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { href: "/admin/ai-usage", label: "AI Usage", icon: Receipt },
  { href: "/admin/projects",           label: "Projects",   icon: FolderKanban },
  { href: "/admin/experiences",        label: "Experience", icon: Briefcase },
  { href: "/admin/comments",           label: "Comments",   icon: MessageSquare },
  { href: "/admin/contact-submissions",label: "Messages",    icon: Mail },
  { href: "/admin/assets",             label: "Assets",     icon: ImageIcon },
  { href: "/admin/settings",           label: "Settings",   icon: Settings },
];

interface AdminSidebarProps {
  newContactCount?: number;
  pendingCommentCount?: number;
  onNavigate?: () => void;
}

export function AdminSidebar({ newContactCount = 0, pendingCommentCount = 0, onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/admin/auth/logout`,
        { method: "POST", credentials: "include" }
      );
    } catch {
      // ignore
    }
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="admin-sidebar flex h-full w-60 flex-col border-r border-slate-200 bg-white">
      {/* Logo */}
      <Link href="/admin" onClick={onNavigate} className="admin-sidebar-brand">
        <BrandMark className="h-8 w-8" />
        <div>
          <p className="text-sm font-semibold text-slate-900">Doni Putra.</p>
          <p className="text-xs text-slate-500">Admin</p>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Admin navigation">
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            const showContactBadge = href === "/admin/contact-submissions" && newContactCount > 0;
            const showCommentBadge = href === "/admin/comments" && pendingCommentCount > 0;
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {showContactBadge && (
                      <span
                        className="min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white"
                        aria-label={`${newContactCount} new contact message${newContactCount === 1 ? "" : "s"}`}
                      >
                        {newContactCount > 99 ? "99+" : newContactCount}
                      </span>
                    )}
                    {showCommentBadge && (
                      <span
                        className="min-w-5 rounded-full bg-amber-500 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white"
                        aria-label={`${pendingCommentCount} pending comment${pendingCommentCount === 1 ? "" : "s"}`}
                      >
                        {pendingCommentCount > 99 ? "99+" : pendingCommentCount}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 p-3">
        <div className="mb-2 flex items-center gap-2 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-slate-900">Doni Putra Purbawa</p>
            <p className="truncate text-xs text-slate-400">Owner</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
