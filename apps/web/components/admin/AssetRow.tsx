"use client";

import { useState } from "react";
import { FileText, Image, Edit, Save } from "lucide-react";
import type { SiteAsset } from "@/lib/server-api";
import { adminClient } from "@/lib/admin-api";
import { formatDate } from "@/lib/utils";

const ICON_MAP: Record<string, typeof FileText> = {
  cv_pdf: FileText,
  profile_image: Image,
  og_image: Image,
};

interface Props {
  asset: SiteAsset;
}

export function AssetRow({ asset }: Props) {
  const Icon = ICON_MAP[asset.key] ?? FileText;
  const [url, setUrl] = useState(asset.fileUrl ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await adminClient.updateAsset(asset.key, { fileUrl: url });
      setEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
            <Icon className="h-6 w-6 text-slate-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{asset.label}</h3>
            <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
              <span>{asset.mimeType ?? "—"}</span>
              {asset.sizeBytes && <span>{Math.round(asset.sizeBytes / 1024)} KB</span>}
              <span>Updated {formatDate(asset.updatedAt)}</span>
              {asset.fileUrl ? (
                <a
                  href={asset.fileUrl}
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

        <button
          onClick={editing ? handleSave : () => setEditing(true)}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {editing ? (
            saving ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" /> Save URL
              </>
            )
          ) : (
            <>
              <Edit className="h-3.5 w-3.5" /> Edit URL
            </>
          )}
        </button>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <label className="mb-1.5 block text-xs font-medium text-slate-500">File URL</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={!editing}
          placeholder="https://… or /files/…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
        />
      </div>
    </div>
  );
}
