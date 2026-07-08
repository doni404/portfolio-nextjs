"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/experience", label: "Experience" },
  { href: "/projects", label: "Projects" },
  { href: "/blogs", label: "Blogs" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-slate-900 transition-opacity hover:opacity-75"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Code2 className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-slate-900">Doni Putra</span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150",
                  pathname === href
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/contact"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Hire Me
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 pb-4 md:hidden">
          <ul className="space-y-1 pt-3">
            {navLinks.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    pathname === href
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-100"
                  )}
                >
                  {label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Link
                href="/contact"
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg bg-blue-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
              >
                Hire Me
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
