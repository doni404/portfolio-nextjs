import type { Metadata } from "next";
import Link from "next/link";
import { adminApi } from "@/lib/server-api";
import { CommentModerationRow } from "@/components/admin/CommentModerationRow";

export const metadata: Metadata = { title: "Comments" };

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminComments({ searchParams }: Props) {
  const { status } = await searchParams;
  const res = await adminApi.getComments(status ? { status } : { status: "pending" });
  const comments = res?.data ?? [];
  const total = res?.pagination.total ?? 0;

  const filterTabs = [
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
    { label: "Spam", value: "spam" },
    { label: "All", value: undefined },
  ];

  const activeStatus = status ?? "pending";

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Comments</h1>
        <p className="mt-0.5 text-sm text-slate-500">{total} comment{total !== 1 ? "s" : ""}</p>
      </div>

      {/* Status filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.value ? `/admin/comments?status=${tab.value}` : "/admin/comments"}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              activeStatus === tab.value || (!tab.value && !status)
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {comments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-slate-400">No comments with status &quot;{activeStatus}&quot;.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentModerationRow key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}
