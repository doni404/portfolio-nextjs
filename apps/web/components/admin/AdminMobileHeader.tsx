"use client";

import { useState } from "react";
import { Menu, X, Code2 } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";

export function AdminMobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
            <Code2 className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-900">Admin CMS</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex h-full w-60 flex-col">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-md bg-white p-1.5 text-slate-600 hover:bg-slate-100"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
            <AdminSidebar />
          </div>
        </div>
      )}
    </>
  );
}
