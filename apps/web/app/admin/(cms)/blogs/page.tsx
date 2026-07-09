import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Edit, Eye, Archive } from "lucide-react";
import { adminApi } from "@/lib/server-api";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Blog Posts" };

interface Props {
  searchParams: Promise<{ status?: string }>;
}

const statusVariant: Record<string, "green" | "yellow" | "gray"> = {
  published: "green",
  draft: "yellow",
  archived: "gray",
};

export default async function AdminBlogs({ searchParams }: Props) {
  const { status } = await searchParams;
  const res = await adminApi.getBlogs(status ? { status } : undefined);
  const posts = res?.data ?? [];
  const total = res?.pagination.total ?? 0;

  const filterTabs = [
    { label: "All", value: undefined },
    { label: "Published", value: "published" },
    { label: "Draft", value: "draft" },
    { label: "Archived", value: "archived" },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blog Posts</h1>
          <p className="mt-0.5 text-sm text-slate-500">{total} post{total !== 1 ? "s" : ""} total</p>
        </div>
        <Link
          href="/admin/blogs/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> New Post
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.value ? `/admin/blogs?status=${tab.value}` : "/admin/blogs"}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              status === tab.value || (!status && !tab.value)
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left">
              <th className="px-4 py-3 font-medium text-slate-600">Title</th>
              <th className="hidden px-4 py-3 font-medium text-slate-600 sm:table-cell">Category</th>
              <th className="hidden px-4 py-3 font-medium text-slate-600 md:table-cell">Published</th>
              <th className="px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  No posts found.{" "}
                  <Link href="/admin/blogs/new" className="font-medium text-blue-600 hover:underline">
                    Create one →
                  </Link>
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="group hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 line-clamp-1">{post.title}</p>
                    <p className="text-xs text-slate-400">/blogs/{post.slug}</p>
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">
                    {post.category?.name ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-slate-500 md:table-cell">
                    {post.publishedAt ? formatDate(post.publishedAt) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[post.status] ?? "gray"}>{post.status}</Badge>
                    {post.featured && (
                      <Badge variant="yellow" className="ml-1">featured</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Link
                        href={`/admin/blogs/${post.id}`}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      {post.status === "published" && (
                        <Link
                          href={`/blogs/${post.slug}`}
                          target="_blank"
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          title="View live"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
