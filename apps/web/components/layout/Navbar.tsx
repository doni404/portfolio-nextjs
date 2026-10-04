"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/blogs", label: "Journal" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/experience", label: "Experience" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const mobileOpen = openPath === pathname;

  return (
    <header className={`site-header ${pathname === "/" ? "on-home" : ""}`}>
      <nav className="site-nav site-container" aria-label="Main navigation">
        <Link href="/" className="site-brand" onClick={() => setOpenPath(null)}>
          <BrandMark className="h-9 w-9" />
          <span>
            Doni Putra<span className="brand-period">.</span>
          </span>
        </Link>
        <ul className="desktop-nav">
          {navLinks.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={
                  pathname === href ||
                  (href !== "/" && pathname.startsWith(href + "/"))
                    ? "page"
                    : undefined
                }
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/contact" className="nav-contact">
          Let&apos;s talk <ArrowUpRight size={16} />
        </Link>
        <button
          className="mobile-menu-toggle icon-control"
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          onClick={() => setOpenPath(mobileOpen ? null : pathname)}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>
      {mobileOpen && (
        <nav
          id="mobile-navigation"
          className="mobile-nav site-container"
          aria-label="Mobile navigation"
        >
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              onClick={() => setOpenPath(null)}
            >
              {label}
              <ArrowUpRight size={16} />
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
