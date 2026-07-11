import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMobileHeader } from "@/components/admin/AdminMobileHeader";
import { adminApi } from "@/lib/server-api";

export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  const [contactCountResponse, commentCountResponse] = await Promise.all([
    adminApi.getNewContactSubmissionCount(),
    adminApi.getPendingCommentCount(),
  ]);
  const newContactCount = contactCountResponse?.data.count ?? 0;
  const pendingCommentCount = commentCountResponse?.data.count ?? 0;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <AdminSidebar
          newContactCount={newContactCount}
          pendingCommentCount={pendingCommentCount}
        />
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <AdminMobileHeader
          newContactCount={newContactCount}
          pendingCommentCount={pendingCommentCount}
        />

        {/* Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
