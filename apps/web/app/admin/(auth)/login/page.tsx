import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";
import { Code2, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

export default function AdminLogin() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="relative mb-4">
            <img
              src="/profile.png"
              alt="Doni Putra Purbawa"
              className="h-16 w-16 rounded-2xl object-cover shadow-lg ring-2 ring-blue-100"
            />
            <div className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 shadow">
              <Code2 className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Admin CMS</h1>
          <p className="mt-1 text-sm text-slate-500">Doni Putra Portfolio</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Shield className="h-4 w-4 text-blue-600" /> Sign In
            </h2>
            <p className="mt-1 text-sm text-slate-500">Enter your credentials to access the CMS</p>
          </div>
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Protected admin area. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  );
}
