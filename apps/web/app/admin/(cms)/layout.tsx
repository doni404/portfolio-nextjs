import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMobileHeader } from "@/components/admin/AdminMobileHeader";

export default function CmsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <AdminSidebar />
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <AdminMobileHeader />

        {/* Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
