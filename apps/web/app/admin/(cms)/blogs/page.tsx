import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Edit, Eye, Trash2, Archive } from "lucide-react";
import { blogPosts } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Blog Posts" };

export default function AdminBlogs() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blog Posts</h1>
          <p className="mt-1 text-slate-500">{blogPosts.length} total posts</p>
        </div>
        <Link
          href="/admin/blogs/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> New Post
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {["All", "Published", "Draft", "Archived"].map((filter) => (
          <button
            key={filter}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === "All"
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Title</th>
              <th className="hidden px-4 py-3 text-left font-semibold text-slate-600 sm:table-cell">
                Category
              </th>
              <th className="hidden px-4 py-3 text-left font-semibold text-slate-600 md:table-cell">
                Published
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {blogPosts.map((post) => (
              <tr key={post.id} className="group hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-900 line-clamp-1">{post.title}</p>
                    <p className="text-xs text-slate-400 line-clamp-1">{post.excerpt}</p>
                  </div>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <Badge variant="blue">{post.category}</Badge>
                </td>
                <td className="hidden px-4 py-3 text-slate-500 md:table-cell">
                  {formatDate(post.publishedAt)}
                </td>
                <td className="px-4 py-3">
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
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
                    <Link
                      href={`/admin/blogs/${post.id}`}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-600"
                      title="Archive"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                    <button
                      className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
