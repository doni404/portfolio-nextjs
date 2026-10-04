import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Edit, Eye } from "lucide-react";
import { adminApi } from "@/lib/server-api";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminFilters } from "@/components/admin/AdminFilters";
import { AdminSortSelect } from "@/components/admin/AdminSortSelect";

export const metadata: Metadata = { title: "Blog Posts" };

interface Props {
  searchParams: Promise<{ status?: string; sort?: string }>;
}

const statusVariant: Record<string, "green" | "yellow" | "gray"> = {
  published: "green",
  draft: "yellow",
  archived: "gray",
};

export default async function AdminBlogs({ searchParams }: Props) {
  const { status, sort } = await searchParams;
  const sortOptions = [
    { label: "Latest updated", value: "latest" },
    { label: "Newest created", value: "created" },
    { label: "Published date", value: "published" },
  ];
  const activeSort = sortOptions.some((option) => option.value === sort) ? sort! : "latest";
  const requestParams = {
    ...(status ? { status } : {}),
    ...(activeSort !== "latest" ? { sort: activeSort } : {}),
  };
  const res = await adminApi.getBlogs(Object.keys(requestParams).length ? requestParams : undefined);
  const posts = res?.data ?? [];
  const total = res?.pagination.total ?? 0;

  const filterTabs = [
    { label: "All", value: undefined },
    { label: "Published", value: "published" },
    { label: "Draft", value: "draft" },
    { label: "Archived", value: "archived" },
  ];

  function listHref(next: { status?: string; sort?: string }) {
    const params = new URLSearchParams();
    if (next.status) params.set("status", next.status);
    if (next.sort && next.sort !== "latest") params.set("sort", next.sort);
    const query = params.toString();
    return query ? `/admin/blogs?${query}` : "/admin/blogs";
  }

  return (
    <div className="admin-page">
      <AdminPageHeader title="Journal" description={`${total} post${total !== 1 ? "s" : ""}`} actions={
        <Link
          href="/admin/blogs/new"
          className="admin-primary-button"
        >
          <Plus className="h-4 w-4" /> New Post
        </Link>
      } />

      <div className="admin-list-toolbar">
        <AdminFilters options={filterTabs.map((tab) => ({
          label: tab.label,
          href: listHref({ status: tab.value, sort: activeSort }),
          active: status === tab.value || (!status && !tab.value),
        }))} />
        <AdminSortSelect value={activeSort} options={sortOptions.map((option) => ({
          ...option, href: listHref({ status, sort: option.value }),
        }))} />
      </div>

      {/* Table */}
      <div className="admin-table-wrap">
        <table className="admin-content-table w-full text-sm" aria-label="Journal posts">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left">
              <th className="px-4 py-3 font-medium text-slate-600">Title</th>
              <th className="hidden px-4 py-3 font-medium text-slate-600 sm:table-cell">Category</th>
              <th className="hidden px-4 py-3 font-medium text-slate-600 md:table-cell">Updated</th>
              <th className="hidden px-4 py-3 font-medium text-slate-600 xl:table-cell">Published</th>
              <th className="px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {posts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
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
                    <Link href={`/admin/blogs/${post.id}`} className="font-medium text-slate-900 line-clamp-1 hover:text-blue-700">{post.title}</Link>
                    <p className="text-xs text-slate-400">/blogs/{post.slug}</p>
                    <p className="admin-table-mobile-meta">{post.category?.name ?? "Uncategorized"} · {formatDate(post.updatedAt)}</p>
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">
                    {post.category?.name ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-slate-500 md:table-cell">
                    {formatDate(post.updatedAt)}
                  </td>
                  <td className="hidden px-4 py-3 text-slate-500 xl:table-cell">
                    {post.publishedAt ? formatDate(post.publishedAt) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[post.status] ?? "gray"}>{post.status}</Badge>
                    {post.featured && (
                      <Badge variant="yellow" className="ml-1">featured</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="admin-row-actions">
                      <Link
                        href={`/admin/blogs/${post.id}`}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                        title="Edit"
                        aria-label={`Edit ${post.title}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      {post.status === "published" && (
                        <Link
                          href={`/blogs/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          title="View live"
                          aria-label={`View ${post.title}`}
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
