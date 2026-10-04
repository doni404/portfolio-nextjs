"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2, Save } from "lucide-react";
import { adminClient } from "@/lib/admin-api";
import type { Experience } from "@/lib/server-api";

interface Props {
  experience?: Experience | null;
  onClose: () => void;
  onSaved: (exp: Experience) => void;
}

function toDateInput(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().slice(0, 7); // YYYY-MM
}

function fromDateInput(val: string) {
  if (!val) return null;
  return new Date(val + "-01").toISOString();
}

export function ExperienceEditor({ experience, onClose, onSaved }: Props) {
  const isEdit = !!experience;
  const backdropRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const [company, setCompany] = useState(experience?.company ?? "");
  const [role, setRole] = useState(experience?.role ?? "");
  const [location, setLocation] = useState(experience?.location ?? "");
  const [startDate, setStartDate] = useState(toDateInput(experience?.startDate));
  const [endDate, setEndDate] = useState(toDateInput(experience?.endDate));
  const [isCurrent, setIsCurrent] = useState(experience?.isCurrent ?? false);
  const [summary, setSummary] = useState(experience?.summary ?? "");
  const [highlights, setHighlights] = useState(
    (experience?.highlights ?? []).join("\n")
  );
  const [technologies, setTechnologies] = useState(
    (experience?.technologies ?? []).join(", ")
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const controls = dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), textarea, select");
      const first = controls?.[0], last = controls?.[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => { window.removeEventListener("keydown", handler); previous?.focus(); };
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      company,
      role,
      location: location || undefined,
      startDate: fromDateInput(startDate),
      endDate: isCurrent ? null : fromDateInput(endDate),
      isCurrent,
      summary: summary || undefined,
      highlights: highlights.split("\n").map((s) => s.trim()).filter(Boolean),
      technologies: technologies.split(",").map((s) => s.trim()).filter(Boolean),
    };

    try {
      let res: { data: Experience };
      if (isEdit) {
        res = await adminClient.updateExperience(experience!.id, payload) as { data: Experience };
      } else {
        res = await adminClient.createExperience(payload) as { data: Experience };
      }
      onSaved(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-8 backdrop-blur-sm"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div ref={dialogRef} className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="experience-editor-title">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 id="experience-editor-title" className="font-semibold text-slate-900">
            {isEdit ? "Edit Experience" : "Add Experience"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close experience editor"
            title="Close"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
              {error}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="exp-company" className="mb-1.5 block text-sm font-medium text-slate-700">Company *</label>
              <input
                type="text"
                value={company}
                id="exp-company"
                onChange={(e) => setCompany(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label htmlFor="exp-role" className="mb-1.5 block text-sm font-medium text-slate-700">Role / Title *</label>
              <input
                type="text"
                value={role}
                id="exp-role"
                onChange={(e) => setRole(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label htmlFor="exp-location" className="mb-1.5 block text-sm font-medium text-slate-700">Location</label>
            <input
              type="text"
              value={location}
              id="exp-location"
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Jakarta, Indonesia · Remote"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="exp-start" className="mb-1.5 block text-sm font-medium text-slate-700">Start Date *</label>
              <input
                type="month"
                value={startDate}
                id="exp-start"
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label htmlFor="exp-end" className="mb-1.5 block text-sm font-medium text-slate-700">End Date</label>
              <input
                type="month"
                value={endDate}
                id="exp-end"
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isCurrent}
                placeholder="Present"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isCurrent"
              checked={isCurrent}
              onChange={(e) => {
                setIsCurrent(e.target.checked);
                if (e.target.checked) setEndDate("");
              }}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isCurrent" className="text-sm text-slate-700">
              I currently work here (shows &ldquo;Present&rdquo; as end date)
            </label>
          </div>

          <div>
            <label htmlFor="exp-summary" className="mb-1.5 block text-sm font-medium text-slate-700">Summary</label>
            <textarea
              value={summary}
              id="exp-summary"
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              placeholder="Brief description of your role…"
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label htmlFor="exp-highlights" className="mb-1.5 block text-sm font-medium text-slate-700">
              Highlights <span className="font-normal text-slate-400">(one per line)</span>
            </label>
            <textarea
              value={highlights}
              id="exp-highlights"
              onChange={(e) => setHighlights(e.target.value)}
              rows={4}
              placeholder={"Led migration to microservices\nReduced latency by 40%"}
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label htmlFor="exp-technologies" className="mb-1.5 block text-sm font-medium text-slate-700">
              Technologies <span className="font-normal text-slate-400">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={technologies}
              id="exp-technologies"
              onChange={(e) => setTechnologies(e.target.value)}
              placeholder="Go, Kubernetes, PostgreSQL, Redis"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isEdit ? "Save Changes" : "Add Experience"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
