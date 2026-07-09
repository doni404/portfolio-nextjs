import type { Metadata } from "next";
import Link from "next/link";
import { adminApi } from "@/lib/server-api";
import { ContactSubmissionRow } from "@/components/admin/ContactSubmissionRow";

export const metadata: Metadata = { title: "Contact Submissions" };

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminContactSubmissions({ searchParams }: Props) {
  const { status } = await searchParams;
  const res = await adminApi.getContactSubmissions(status ? { status } : undefined);
  const submissions = res?.data ?? [];
  const total = res?.pagination.total ?? 0;

  const filterTabs = [
    { label: "All", value: undefined },
    { label: "New", value: "new" },
    { label: "Read", value: "read" },
    { label: "Replied", value: "replied" },
    { label: "Archived", value: "archived" },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Contact Submissions</h1>
        <p className="mt-0.5 text-sm text-slate-500">{total} message{total !== 1 ? "s" : ""}</p>
      </div>

      {/* Status filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.value ? `/admin/contact-submissions?status=${tab.value}` : "/admin/contact-submissions"}
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

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {submissions.length === 0 ? (
          <div className="py-16 text-center text-slate-400">No submissions found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-4 py-3 font-medium text-slate-600">From</th>
                <th className="hidden px-4 py-3 font-medium text-slate-600 sm:table-cell">Subject</th>
                <th className="hidden px-4 py-3 font-medium text-slate-600 md:table-cell">Date</th>
                <th className="px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 font-medium text-slate-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.map((sub) => (
                <ContactSubmissionRow key={sub.id} submission={sub} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
