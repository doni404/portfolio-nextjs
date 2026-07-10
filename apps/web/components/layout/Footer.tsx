import Link from "next/link";
import { Mail } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <BrandMark className="h-8 w-8" />
              <span className="font-semibold text-slate-900">Doni Putra Purbawa</span>
            </Link>
            <p className="mt-3 max-w-sm text-sm text-slate-500">
              Cloud Architect and Senior Backend Engineer building reliable AWS, fintech, and
              AI-powered systems. Based in Indonesia, open to Japan opportunities.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://github.com/doni404"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 transition-colors hover:text-slate-700"
                aria-label="GitHub"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a
                href="https://linkedin.com/in/doniputrapurbawa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 transition-colors hover:text-slate-700"
                aria-label="LinkedIn"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a
                href="mailto:doniputrapurbawa@gmail.com"
                className="text-slate-400 transition-colors hover:text-slate-700"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Navigation</h3>
            <ul className="space-y-2">
              {[
                { href: "/", label: "Home" },
                { href: "/about", label: "About" },
                { href: "/experience", label: "Experience" },
                { href: "/projects", label: "Projects" },
                { href: "/blogs", label: "Blogs" },
                { href: "/contact", label: "Contact" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-slate-500 transition-colors hover:text-slate-900"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Contact</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:doniputrapurbawa@gmail.com"
                  className="text-sm text-slate-500 transition-colors hover:text-slate-900"
                >
                  doniputrapurbawa@gmail.com
                </a>
              </li>
              <li className="text-sm text-slate-500">Indonesia</li>
              <li className="text-sm text-slate-500">Open to Japan relocation</li>
              <li className="pt-1">
                <Link
                  href="/contact"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Get in touch →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row">
          <p className="text-xs text-slate-400">
            © {year} Doni Putra Purbawa. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-xs text-slate-400 hover:text-slate-600">
              Admin
            </Link>
            <a href="/rss.xml" className="text-xs text-slate-400 hover:text-slate-600">
              RSS
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
