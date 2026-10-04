import type { Metadata } from "next";
import { adminApi } from "@/lib/server-api";
import { ContactSubmissionRow } from "@/components/admin/ContactSubmissionRow";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminFilters } from "@/components/admin/AdminFilters";

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
    <div className="admin-page">
      <AdminPageHeader title="Messages" description={`${total} message${total !== 1 ? "s" : ""}`} />

      {/* Status filter tabs */}
      <div className="admin-list-toolbar">
        <AdminFilters options={filterTabs.map((tab) => ({
          label: tab.label,
          href: tab.value ? `/admin/contact-submissions?status=${tab.value}` : "/admin/contact-submissions",
          active: status === tab.value || (!status && !tab.value),
        }))} />
      </div>

      <div className="admin-table-wrap">
        {submissions.length === 0 ? (
          <div className="py-16 text-center text-slate-400">No submissions found.</div>
        ) : (
          <table className="admin-message-table w-full text-sm" aria-label="Contact messages">
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
