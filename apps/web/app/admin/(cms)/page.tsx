import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  FolderKanban,
  MessageSquare,
  Mail,
  TrendingUp,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
} from "lucide-react";
import { dashboardStats, blogPosts, comments, contactSubmissions } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Dashboard" };

const statCards = [
  {
    label: "Published Posts",
    value: dashboardStats.publishedPosts,
    icon: FileText,
    color: "text-blue-600 bg-blue-50",
    href: "/admin/blogs",
  },
  {
    label: "Draft Posts",
    value: dashboardStats.draftPosts,
    icon: Clock,
    color: "text-amber-600 bg-amber-50",
    href: "/admin/blogs",
  },
  {
    label: "Pending Comments",
    value: dashboardStats.pendingComments,
    icon: MessageSquare,
    color: "text-violet-600 bg-violet-50",
    href: "/admin/comments",
  },
  {
    label: "New Messages",
    value: dashboardStats.newContactSubmissions,
    icon: Mail,
    color: "text-emerald-600 bg-emerald-50",
    href: "/admin/contact-submissions",
  },
  {
    label: "Featured Projects",
    value: dashboardStats.featuredProjects,
    icon: FolderKanban,
    color: "text-red-600 bg-red-50",
    href: "/admin/projects",
  },
  {
    label: "Total Views",
    value: "—",
    icon: TrendingUp,
    color: "text-slate-600 bg-slate-100",
    href: "#",
  },
];

export default function AdminDashboard() {
  const pendingComments = comments.filter((c) => c.status === "pending");
  const recentPosts = blogPosts.slice(0, 4);
  const recentMessages = contactSubmissions.filter((s) => s.status === "new").slice(0, 3);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-500">
          Welcome back, Doni. Here&apos;s what&apos;s happening.
        </p>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map(({ label, value, icon: Icon, color, href }) => (
          <Link
            key={label}
            href={href}
            className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-blue-200 hover:shadow-sm xl:col-span-1"
          >
            <div className={`mb-3 w-fit rounded-lg p-2 ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-2xl font-bold text-slate-900">{value}</span>
            <span className="mt-0.5 text-xs text-slate-500">{label}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent posts */}
        <div className="lg:col-span-2">
          <Card padding={false}>
            <CardHeader className="flex items-center justify-between border-b border-slate-100 p-5 mb-0">
              <CardTitle className="text-base">Recent Blog Posts</CardTitle>
              <Link
                href="/admin/blogs/new"
                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                <Plus className="h-3.5 w-3.5" /> New Post
              </Link>
            </CardHeader>
            <div className="divide-y divide-slate-100">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/admin/blogs/${post.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{post.title}</p>
                    <p className="text-xs text-slate-400">{formatDate(post.publishedAt)}</p>
                  </div>
                  <Badge
                    variant={
                      post.status === "published"
                        ? "green"
                        : post.status === "draft"
                        ? "yellow"
                        : "gray"
                    }
                  >
                    {post.status}
                  </Badge>
                </Link>
              ))}
            </div>
            <div className="border-t border-slate-100 px-5 py-3">
              <Link
                href="/admin/blogs"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View all posts →
              </Link>
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Pending comments */}
          <Card padding={false}>
            <CardHeader className="flex items-center justify-between border-b border-slate-100 p-5 mb-0">
              <CardTitle className="text-base">Pending Comments</CardTitle>
              {pendingComments.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                  {pendingComments.length}
                </span>
              )}
            </CardHeader>
            <div className="divide-y divide-slate-100">
              {pendingComments.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <CheckCircle className="h-6 w-6 text-emerald-400" />
                  <p className="mt-2 text-sm text-slate-400">No pending comments</p>
                </div>
              ) : (
                pendingComments.map((comment) => (
                  <div key={comment.id} className="px-5 py-3.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-900">{comment.authorName}</p>
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{comment.content}</p>
                    <p className="mt-1 text-xs text-slate-400">{comment.postTitle}</p>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-slate-100 px-5 py-3">
              <Link
                href="/admin/comments"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Moderate comments →
              </Link>
            </div>
          </Card>

          {/* New messages */}
          <Card padding={false}>
            <CardHeader className="flex items-center justify-between border-b border-slate-100 p-5 mb-0">
              <CardTitle className="text-base">New Messages</CardTitle>
              {recentMessages.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                  {recentMessages.length}
                </span>
              )}
            </CardHeader>
            <div className="divide-y divide-slate-100">
              {recentMessages.map((msg) => (
                <Link
                  key={msg.id}
                  href="/admin/contact-submissions"
                  className="block px-5 py-3.5 hover:bg-slate-50"
                >
                  <p className="text-xs font-medium text-slate-900">{msg.name}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{msg.subject}</p>
                  <p className="text-xs text-slate-400">{msg.email}</p>
                </Link>
              ))}
            </div>
            <div className="border-t border-slate-100 px-5 py-3">
              <Link
                href="/admin/contact-submissions"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View all messages →
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: "/admin/blogs/new", label: "New Blog Post", icon: FileText, color: "bg-blue-600" },
          { href: "/admin/projects/new", label: "New Project", icon: FolderKanban, color: "bg-violet-600" },
          { href: "/admin/comments", label: "Moderate Comments", icon: MessageSquare, color: "bg-amber-600" },
          { href: "/", label: "View Live Site", icon: Eye, color: "bg-emerald-600" },
        ].map(({ href, label, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            target={href === "/" ? "_blank" : undefined}
            className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center transition-all hover:border-blue-200 hover:shadow-sm"
          >
            <div className={`rounded-lg p-2.5 text-white ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium text-slate-700">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
