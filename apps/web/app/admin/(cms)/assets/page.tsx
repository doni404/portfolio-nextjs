import type { Metadata } from "next";
import { FileText, Image, Upload, Edit } from "lucide-react";

export const metadata: Metadata = { title: "Assets" };

const assets = [
  {
    key: "cv_pdf",
    label: "CV / Resume PDF",
    description: "Downloadable curriculum vitae shown on Home, About, and Contact pages",
    icon: FileText,
    url: "/files/doni-putra-purbawa-cv.pdf",
    size: "—",
    type: "application/pdf",
  },
  {
    key: "profile_image",
    label: "Profile Image",
    description: "Profile photo used on About page and admin sidebar",
    icon: Image,
    url: "",
    size: "—",
    type: "image/jpeg",
  },
  {
    key: "og_image",
    label: "Open Graph Image",
    description: "Default social share image for all public pages",
    icon: Image,
    url: "",
    size: "—",
    type: "image/png",
  },
];

export default function AdminAssets() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Assets</h1>
        <p className="mt-1 text-slate-500">Manage CV, profile image, and Open Graph image</p>
      </div>

      <div className="space-y-4">
        {assets.map(({ key, label, description, icon: Icon, url, size, type }) => (
          <div key={key} className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                  <Icon className="h-6 w-6 text-slate-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{label}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{description}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                    <span>{type}</span>
                    <span>{size}</span>
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        View current
                      </a>
                    ) : (
                      <span className="text-amber-500">No file set</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <Edit className="h-3.5 w-3.5" /> Edit URL
                </button>
                <button className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  <Upload className="h-3.5 w-3.5" /> Upload
                </button>
              </div>
            </div>

            {/* URL input */}
            <div className="mt-4 border-t border-slate-100 pt-4">
              <label className="mb-1.5 block text-xs font-medium text-slate-500">File URL</label>
              <input
                type="url"
                defaultValue={url}
                placeholder="https://… or /files/…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          Save Changes
        </button>
      </div>
    </div>
  );
}
