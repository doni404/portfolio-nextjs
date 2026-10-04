import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMobileHeader } from "@/components/admin/AdminMobileHeader";
import { adminApi } from "@/lib/server-api";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  const [contactCountResponse, commentCountResponse] = await Promise.all([
    adminApi.getNewContactSubmissionCount(),
    adminApi.getPendingCommentCount(),
  ]);
  const newContactCount = contactCountResponse?.data.count ?? 0;
  const pendingCommentCount = commentCountResponse?.data.count ?? 0;

  return (
    <div className="admin-shell flex h-dvh overflow-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <AdminSidebar
          newContactCount={newContactCount}
          pendingCommentCount={pendingCommentCount}
        />
      </div>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <AdminMobileHeader
          newContactCount={newContactCount}
          pendingCommentCount={pendingCommentCount}
        />

        {/* Content */}
        <AdminTopbar />
        <main id="admin-content" className="admin-main flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
