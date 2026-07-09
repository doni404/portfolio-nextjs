"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import type { Project } from "@/lib/server-api";
import { adminClient } from "@/lib/admin-api";

const projectCategories = [
  { label: "Backend Engineering", slug: "backend-engineering" },
  { label: "Payment Systems", slug: "payment-systems" },
  { label: "Cloud & DevOps", slug: "cloud-devops" },
  { label: "AI/LLM Applications", slug: "ai-llm-applications" },
  { label: "Machine Learning", slug: "machine-learning" },
];

interface ProjectEditorProps {
  project?: Project;
}

interface ProjectFormData {
  title: string;
  slug: string;
  summary: string;
  problem: string;
  solution: string;
  role: string;
  outcome: string;
  stack: string;
  year: number;
  categorySlug: string;
  featured: boolean;
  status: "published" | "draft" | "archived";
}

export function ProjectEditor({ project }: ProjectEditorProps) {

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState("");

  const { register, handleSubmit } = useForm<ProjectFormData>({
    defaultValues: {
      title: project?.title ?? "",
      slug: project?.slug ?? "",
      summary: project?.summary ?? "",
      problem: project?.problem ?? "",
      solution: project?.solution ?? "",
      role: project?.role ?? "",
      outcome: project?.outcome ?? "",
      stack: project?.stack?.join(", ") ?? "",
      year: project?.year ?? new Date().getFullYear(),
      categorySlug: project?.category?.slug ?? projectCategories[0].slug,
      featured: project?.featured ?? false,
      status: (project?.status as "published" | "draft" | "archived") ?? "draft",
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    setSaving(true);
    setSaveError("");
    try {
      const stackArray = data.stack
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        title: data.title,
        slug: data.slug,
        summary: data.summary,
        problem: data.problem || undefined,
        solution: data.solution || undefined,
        role: data.role || undefined,
        outcome: data.outcome || undefined,
        stack: stackArray,
        year: data.year,
        categorySlug: data.categorySlug,
        featured: data.featured,
        status: data.status,
      };

      if (project) {
        await adminClient.updateProject(project.id, payload);
      } else {
        await adminClient.createProject(payload);
      }

      window.location.href = "/admin/projects";
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save project.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;
    setDeleting(true);
    try {
      await adminClient.deleteProject(project.id);
      window.location.href = "/admin/projects";
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete project.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/projects" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> Back to projects
        </Link>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Project"}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {saveError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* Basic info */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Project Info</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-500">Title</label>
                <input {...register("title", { required: true })} type="text" placeholder="Payment Gateway & Subscription Platform" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Slug</label>
                <input {...register("slug")} type="text" placeholder="payment-gateway-platform" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Year</label>
                <input {...register("year", { valueAsNumber: true })} type="number" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Summary</label>
              <textarea {...register("summary")} rows={2} placeholder="One-paragraph overview of the project…" className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
          </div>

          {/* Case study content */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Case Study</h2>
            {[
              { name: "problem" as const, label: "Problem", placeholder: "What was the challenge or requirement?" },
              { name: "solution" as const, label: "Solution", placeholder: "How did you solve it?" },
              { name: "role" as const, label: "My Role / Contribution", placeholder: "What was your specific responsibility?" },
              { name: "outcome" as const, label: "Outcome / Result", placeholder: "What was the measurable impact?" },
            ].map(({ name, label, placeholder }) => (
              <div key={name}>
                <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
                <textarea
                  {...register(name)}
                  rows={3}
                  placeholder={placeholder}
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Tech Stack (comma-separated)</label>
              <input {...register("stack")} type="text" placeholder="Node.js, PostgreSQL, Redis, Docker" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Settings</h3>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
              <select {...register("status")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none">
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Category</label>
              <select {...register("categorySlug")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none">
                {projectCategories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input {...register("featured")} type="checkbox" id="proj-featured" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <label htmlFor="proj-featured" className="text-sm text-slate-700">Featured project</label>
            </div>
          </div>

          {project && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-5">
              <h3 className="mb-3 text-sm font-semibold text-red-700">Danger Zone</h3>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? "Deleting…" : "Delete Project"}
              </button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
