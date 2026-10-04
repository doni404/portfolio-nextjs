import type { Metadata } from "next";
import { adminApi } from "@/lib/server-api";
import { CommentModerationRow } from "@/components/admin/CommentModerationRow";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminFilters } from "@/components/admin/AdminFilters";

export const metadata: Metadata = { title: "Comments" };

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminComments({ searchParams }: Props) {
  const { status } = await searchParams;
  const activeStatus = status ?? "pending";
  const res = await adminApi.getComments(activeStatus === "all" ? undefined : { status: activeStatus });
  const comments = res?.data ?? [];
  const total = res?.pagination.total ?? 0;

  const filterTabs = [
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
    { label: "Spam", value: "spam" },
    { label: "All", value: "all" },
  ];

  return (
    <div className="admin-page">
      <AdminPageHeader title="Comments" description={`${total} comment${total !== 1 ? "s" : ""}`} />

      {/* Status filter tabs */}
      <div className="admin-list-toolbar">
        <AdminFilters options={filterTabs.map((tab) => ({
          label: tab.label, href: `/admin/comments?status=${tab.value}`, active: activeStatus === tab.value,
        }))} />
      </div>

      {comments.length === 0 ? (
        <div className="admin-empty">
          <p>{activeStatus === "all" ? "No comments yet." : `No ${activeStatus} comments.`}</p>
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
