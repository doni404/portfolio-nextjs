import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText, FolderKanban, MessageSquare, Mail,
  Clock, CheckCircle, AlertCircle, Plus, ArrowRight,
} from "lucide-react";
import { adminApi } from "@/lib/server-api";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { TrafficAnalytics } from "@/components/admin/TrafficAnalytics";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const res = await adminApi.getDashboard();
  const { stats, recentComments, recentSubmissions } = res?.data ?? {
    stats: { publishedPosts: 0, draftPosts: 0, pendingComments: 0, newContactSubmissions: 0, featuredProjects: 0 },
    recentComments: [],
    recentSubmissions: [],
  };

  const statCards = [
    { label: "Published Posts",   value: stats.publishedPosts,        icon: FileText,      color: "text-blue-600 bg-blue-50",     href: "/admin/blogs?status=published" },
    { label: "Draft Posts",       value: stats.draftPosts,            icon: Clock,         color: "text-amber-600 bg-amber-50",   href: "/admin/blogs?status=draft" },
    { label: "Pending Comments",  value: stats.pendingComments,       icon: MessageSquare, color: "text-violet-600 bg-violet-50", href: "/admin/comments?status=pending" },
    { label: "New Messages",      value: stats.newContactSubmissions, icon: Mail,          color: "text-emerald-600 bg-emerald-50", href: "/admin/contact-submissions?status=new" },
    { label: "Featured Projects", value: stats.featuredProjects,      icon: FolderKanban,  color: "text-red-600 bg-red-50",       href: "/admin/projects" },
  ];

  return (
    <div className="admin-page">
      <AdminPageHeader title="Dashboard" description="Your publishing overview" actions={
        <Link
          href="/admin/blogs/new"
          className="admin-primary-button"
        >
          <Plus className="h-4 w-4" /> New Post
        </Link>
      } />

      {/* Stat cards */}
      <div className="admin-stats mb-8 grid">
        {statCards.map(({ label, value, icon: Icon, color, href }) => (
          <Link
            key={label}
            href={href}
            className="group"
          >
            <div className={`admin-stat-icon ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="mt-0.5 text-xs text-slate-500">{label}</p>
          </Link>
        ))}
      </div>

      <TrafficAnalytics compact />
      <div className="admin-dashboard-feed">
        {/* Pending comments */}
        <section>
            <h2 className="admin-section-title">
              Pending Comments
              {stats.pendingComments > 0 && (
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                  {stats.pendingComments} pending
                </span>
              )}
            </h2>
            {recentComments.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <CheckCircle className="mb-2 h-8 w-8 text-emerald-400" />
                <p className="text-sm text-slate-500">No pending comments</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentComments.map((comment) => (
                  <div key={comment.id} className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                          {comment.authorName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {comment.authorName}
                          </p>
                          <p className="truncate text-xs text-slate-400">
                            On: {comment.blogPost?.title}
                          </p>
                        </div>
                      </div>
                      <Badge variant="yellow">pending</Badge>
                    </div>
                    <p className="mt-1.5 line-clamp-2 pl-9 text-xs text-slate-600">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <Link
              href="/admin/comments?status=pending"
              className="admin-text-link"
            >
              Manage comments <ArrowRight size={14} />
            </Link>
        </section>

        {/* New contact submissions */}
        <section>
            <h2 className="admin-section-title">
              New Messages
              {stats.newContactSubmissions > 0 && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  {stats.newContactSubmissions} new
                </span>
              )}
            </h2>
            {recentSubmissions.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <AlertCircle className="mb-2 h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-500">No new messages</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentSubmissions.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-3 py-3">
                    <div aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-600">{sub.name.charAt(0)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{sub.name}</p>
                      <p className="truncate text-xs text-slate-400">
                        {sub.subject ?? sub.email}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <Badge variant="blue">new</Badge>
                      <p className="mt-0.5 text-xs text-slate-400">{formatDate(sub.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link
              href="/admin/contact-submissions"
              className="admin-text-link"
            >
              View messages <ArrowRight size={14} />
            </Link>
        </section>
      </div>
    </div>
  );
}
