import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText, FolderKanban, MessageSquare, Mail,
  TrendingUp, Clock, CheckCircle, AlertCircle, Plus,
} from "lucide-react";
import { adminApi } from "@/lib/server-api";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

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
    { label: "Total Views",       value: "—",                         icon: TrendingUp,    color: "text-slate-600 bg-slate-100",  href: "#" },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Welcome back, Doni. Here's what's happening.</p>
        </div>
        <Link
          href="/admin/blogs/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> New Post
        </Link>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map(({ label, value, icon: Icon, color, href }) => (
          <Link
            key={label}
            href={href}
            className="group rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
          >
            <div className={`mb-3 inline-flex rounded-lg p-2 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="mt-0.5 text-xs text-slate-500">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending comments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm">
              Pending Comments
              {stats.pendingComments > 0 && (
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                  {stats.pendingComments} pending
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
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
              className="mt-3 block text-center text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Manage all comments →
            </Link>
          </CardContent>
        </Card>

        {/* New contact submissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm">
              New Messages
              {stats.newContactSubmissions > 0 && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  {stats.newContactSubmissions} new
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSubmissions.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <AlertCircle className="mb-2 h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-500">No new messages</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentSubmissions.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-3 py-3">
                    <img
                      src="/profile.png"
                      alt=""
                      className="h-7 w-7 flex-shrink-0 rounded-full object-cover opacity-50"
                    />
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
              className="mt-3 block text-center text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              View all messages →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
