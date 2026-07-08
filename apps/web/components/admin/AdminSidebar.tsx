"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Code2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/blogs",
    label: "Blog Posts",
    icon: FileText,
  },
  {
    href: "/admin/projects",
    label: "Projects",
    icon: FolderKanban,
  },
  {
    href: "/admin/experiences",
    label: "Experience",
    icon: Briefcase,
  },
  {
    href: "/admin/comments",
    label: "Comments",
    icon: MessageSquare,
    badge: 2,
  },
  {
    href: "/admin/contact-submissions",
    label: "Contact",
    icon: Mail,
    badge: 2,
  },
  {
    href: "/admin/assets",
    label: "Assets",
    icon: ImageIcon,
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-col border-r border-slate-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <Code2 className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Admin CMS</p>
          <p className="text-xs text-slate-400">Doni Putra Portfolio</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon, badge }) => {
            const isActive =
              href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
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
                    {badge ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                        {badge}
                      </span>
                    ) : isActive ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 p-3">
        <div className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2">
          <img
            src="/profile.png"
            alt="Doni Putra Purbawa"
            className="h-8 w-8 rounded-full object-cover ring-2 ring-blue-100"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-slate-900">Doni Putra Purbawa</p>
            <p className="truncate text-xs text-slate-400">Owner</p>
          </div>
        </div>
        <Link
          href="/admin/login"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </Link>
      </div>
    </aside>
  );
}
