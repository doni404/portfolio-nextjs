import type { Metadata } from "next";
import { Save, User, Globe, Bell } from "lucide-react";

export const metadata: Metadata = { title: "Settings" };

export default function AdminSettings() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-slate-500">Manage admin account and site preferences</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile */}
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-5 flex items-center gap-2 font-semibold text-slate-900">
            <User className="h-4 w-4 text-blue-600" /> Admin Profile
          </h2>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Name</label>
                <input
                  type="text"
                  defaultValue="Doni Putra Purbawa"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  defaultValue="doniputrapurbawa@gmail.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">New Password</label>
              <input
                type="password"
                placeholder="Leave blank to keep current password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </section>

        {/* Site settings */}
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-5 flex items-center gap-2 font-semibold text-slate-900">
            <Globe className="h-4 w-4 text-blue-600" /> Site Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Site Name</label>
              <input
                type="text"
                defaultValue="Doni Putra Purbawa"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Site URL</label>
              <input
                type="url"
                defaultValue="https://doniputrapurbawa.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Site Description</label>
              <textarea
                rows={3}
                defaultValue="Senior Backend Engineer specializing in fintech, cloud infrastructure, microservices, and AI-powered systems."
                className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-5 flex items-center gap-2 font-semibold text-slate-900">
            <Bell className="h-4 w-4 text-blue-600" /> Notifications
          </h2>
          <div className="space-y-3">
            {[
              { id: "notify_comments", label: "Email me when a new comment is submitted" },
              { id: "notify_contact", label: "Email me when a contact form is submitted" },
            ].map(({ id, label }) => (
              <div key={id} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={id}
                  defaultChecked
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor={id} className="text-sm text-slate-700">{label}</label>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end">
          <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            <Save className="h-4 w-4" /> Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
