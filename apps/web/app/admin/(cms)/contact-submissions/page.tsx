import type { Metadata } from "next";
import { contactSubmissions } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { ContactSubmissionRow } from "@/components/admin/ContactSubmissionRow";

export const metadata: Metadata = { title: "Contact Submissions" };

export default function AdminContactSubmissions() {
  const counts = {
    all: contactSubmissions.length,
    new: contactSubmissions.filter((s) => s.status === "new").length,
    read: contactSubmissions.filter((s) => s.status === "read").length,
    replied: contactSubmissions.filter((s) => s.status === "replied").length,
    archived: contactSubmissions.filter((s) => s.status === "archived").length,
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Contact Submissions</h1>
        <p className="mt-1 text-slate-500">{counts.new} new messages</p>
      </div>

      {/* Status tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "new", "read", "replied", "archived"] as const).map((status) => (
          <button
            key={status}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
              status === "all"
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {status} <span className="ml-1 text-xs opacity-70">({counts[status]})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Sender</th>
              <th className="hidden px-4 py-3 text-left font-semibold text-slate-600 sm:table-cell">Subject</th>
              <th className="hidden px-4 py-3 text-left font-semibold text-slate-600 md:table-cell">Date</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contactSubmissions.map((sub) => (
              <ContactSubmissionRow key={sub.id} submission={sub} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
