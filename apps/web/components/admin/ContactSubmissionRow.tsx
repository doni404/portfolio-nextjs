"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ContactSubmission } from "@/lib/server-api";
import { adminClient } from "@/lib/admin-api";
import { Badge } from "@/components/ui/Badge";
import { Eye, MailCheck, Archive } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Props {
  submission: ContactSubmission;
}

const statusVariants: Record<string, "blue" | "green" | "gray" | "yellow"> = {
  new: "blue",
  read: "gray",
  replied: "green",
  archived: "gray",
};

export function ContactSubmissionRow({ submission }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(submission.status);
  const [expanded, setExpanded] = useState(false);
  const [actioning, setActioning] = useState(false);

  async function updateStatus(newStatus: ContactSubmission["status"]) {
    setActioning(true);
    try {
      await adminClient.updateContactStatus(submission.id, newStatus);
      setStatus(newStatus);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setActioning(false);
    }
  }

  return (
    <>
      <tr
        className={`group cursor-pointer hover:bg-slate-50 ${
          status === "new" ? "bg-blue-50/30" : ""
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3">
          <div>
            <button type="button" className="admin-message-toggle" aria-expanded={expanded} aria-controls={`message-${submission.id}`} onClick={(event) => { event.stopPropagation(); setExpanded(!expanded); }}>
              {submission.name}
            </button>
            <p className="text-xs text-slate-500">{submission.email}</p>
            {submission.company && (
              <p className="text-xs text-slate-400">{submission.company}</p>
            )}
            <p className="admin-message-subject">{submission.subject ?? "(no subject)"}</p>
            <p className="admin-table-mobile-meta">{formatDate(submission.createdAt)}</p>
          </div>
        </td>
        <td className="hidden px-4 py-3 text-slate-700 sm:table-cell">
          <p className="line-clamp-1">{submission.subject ?? "(no subject)"}</p>
        </td>
        <td className="hidden px-4 py-3 text-slate-500 md:table-cell">
          {formatDate(submission.createdAt)}
        </td>
        <td className="px-4 py-3">
          <Badge variant={statusVariants[status] ?? "gray"}>{status}</Badge>
        </td>
        <td className="px-4 py-3">
          <div className="admin-row-actions">
            <button
              onClick={(e) => { e.stopPropagation(); updateStatus("read"); }}
              disabled={actioning || status === "read"}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
              title="Mark as read"
              aria-label="Mark as read"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); updateStatus("replied"); }}
              disabled={actioning || status === "replied"}
              className="rounded-md p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-40"
              title="Mark as replied"
              aria-label="Mark as replied"
            >
              <MailCheck className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); updateStatus("archived"); }}
              disabled={actioning || status === "archived"}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-500 disabled:opacity-40"
              title="Archive"
              aria-label="Archive message"
            >
              <Archive className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-50">
          <td colSpan={5} className="px-4 py-3">
            <div id={`message-${submission.id}`} className="max-w-2xl">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Message</p>
              <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{submission.message}</p>
              <div className="mt-3 flex gap-2">
                <a
                  href={`mailto:${submission.email}?subject=Re: ${submission.subject ?? ""}`}
                  onClick={() => updateStatus("replied")}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  <MailCheck className="h-3.5 w-3.5" /> Reply by Email
                </a>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
