"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminComment } from "@/lib/server-api";
import { adminClient } from "@/lib/admin-api";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle, XCircle, AlertTriangle, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Props {
  comment: AdminComment;
}

const statusVariants: Record<string, "green" | "yellow" | "red" | "gray"> = {
  approved: "green",
  pending: "yellow",
  rejected: "red",
  spam: "gray",
};

export function CommentModerationRow({ comment }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(comment.status);
  const [actioning, setActioning] = useState(false);
  const [deleted, setDeleted] = useState(false);

  async function doAction(newStatus: AdminComment["status"]) {
    setActioning(true);
    try {
      await adminClient.updateCommentStatus(comment.id, newStatus);
      setStatus(newStatus);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActioning(false);
    }
  }

  async function doDelete() {
    if (!confirm("Delete this comment permanently?")) return;
    setActioning(true);
    try {
      await adminClient.deleteComment(comment.id);
      setDeleted(true);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setActioning(false);
    }
  }

  if (deleted) return null;

  return (
    <div
      className={`rounded-xl border bg-white p-5 transition-colors ${
        status === "pending" ? "border-amber-200" : "border-slate-200"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
              {comment.authorName.charAt(0)}
            </div>
            <span className="font-medium text-slate-900">{comment.authorName}</span>
            <span className="text-xs text-slate-400">{comment.authorEmail}</span>
            <Badge variant={statusVariants[status] ?? "gray"}>{status}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            On:{" "}
            <span className="font-medium text-slate-600">{comment.blogPost?.title}</span>
            {" · "}
            {formatDate(comment.createdAt)}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{comment.content}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-shrink-0 items-center gap-1">
          {status !== "approved" && (
            <button
              onClick={() => doAction("approved")}
              disabled={actioning}
              className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50"
              title="Approve"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          )}
          {status !== "rejected" && (
            <button
              onClick={() => doAction("rejected")}
              disabled={actioning}
              className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100 disabled:opacity-50"
              title="Reject"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
          {status !== "spam" && (
            <button
              onClick={() => doAction("spam")}
              disabled={actioning}
              className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-600 hover:bg-amber-100 disabled:opacity-50"
              title="Mark as spam"
            >
              <AlertTriangle className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={doDelete}
            disabled={actioning}
            className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            title="Delete permanently"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
