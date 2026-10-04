"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminBreadcrumbs } from "./AdminTopbar";

export function AdminMobileHeader({
  newContactCount = 0,
  pendingCommentCount = 0,
}: {
  newContactCount?: number;
  pendingCommentCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const menuTrigger = trigger.current;
    dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Tab") {
        const items = dialog.current?.querySelectorAll<HTMLElement>(
          "a[href],button:not([disabled])",
        );
        const first = items?.[0],
          last = items?.[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      menuTrigger?.focus();
    };
  }, [open]);

  return (
    <>
      <header className="admin-mobile-header lg:hidden">
        <button
          ref={trigger}
          onClick={() => setOpen(true)}
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="admin-navigation-dialog"
        >
          <Menu className="h-5 w-5" />
        </button>
        <AdminBreadcrumbs />
        <Link href="/" target="_blank" rel="noopener noreferrer" className="admin-icon-button" title="View website" aria-label="View website">
          <ArrowUpRight size={18} />
        </Link>
      </header>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div
            ref={dialog}
            id="admin-navigation-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Studio navigation"
            className="admin-navigation-dialog relative flex h-full flex-col"
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-md bg-white p-1.5 text-slate-600 hover:bg-slate-100"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
            <AdminSidebar
              onNavigate={() => setOpen(false)}
              newContactCount={newContactCount}
              pendingCommentCount={pendingCommentCount}
            />
          </div>
        </div>
      )}
    </>
  );
}
