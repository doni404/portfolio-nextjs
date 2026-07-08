import type { Metadata } from "next";
import { comments } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { CommentModerationRow } from "@/components/admin/CommentModerationRow";

export const metadata: Metadata = { title: "Comment Moderation" };

const statusVariants: Record<string, "green" | "yellow" | "red" | "gray"> = {
  approved: "green",
  pending: "yellow",
  rejected: "red",
  spam: "gray",
};

export default function AdminComments() {
  const counts = {
    all: comments.length,
    pending: comments.filter((c) => c.status === "pending").length,
    approved: comments.filter((c) => c.status === "approved").length,
    rejected: comments.filter((c) => c.status === "rejected").length,
    spam: comments.filter((c) => c.status === "spam").length,
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Comment Moderation</h1>
        <p className="mt-1 text-slate-500">{counts.pending} comments awaiting review</p>
      </div>

      {/* Status tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "pending", "approved", "rejected", "spam"] as const).map((status) => (
          <button
            key={status}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
              status === "all"
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {status}{" "}
            <span className="ml-1 text-xs opacity-70">({counts[status as keyof typeof counts]})</span>
          </button>
        ))}
      </div>

      {/* Comments list */}
      <div className="space-y-3">
        {comments.map((comment) => (
          <CommentModerationRow key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  );
}
