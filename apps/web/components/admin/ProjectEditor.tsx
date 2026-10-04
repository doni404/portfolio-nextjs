"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileImage, Save, Trash2, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import type { Project } from "@/lib/server-api";
import { adminClient } from "@/lib/admin-api";
import { mediaUrl } from "@/lib/media";

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
  coverImageUrl: string;
  links: string;
  year: number;
  categorySlug: string;
  featured: boolean;
  status: "published" | "draft" | "archived";
}

export function ProjectEditor({ project }: ProjectEditorProps) {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const coverPreviewUrl = mediaUrl(project?.coverImageUrl);

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
      coverImageUrl: project?.coverImageUrl ?? "",
      links: project?.links?.map((link) => `${link.label} | ${link.url}`).join("\n") ?? "",
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
      const links = data.links
        .split("\n")
        .map((line) => {
          const [label, ...urlParts] = line.split("|");
          return { label: label?.trim() ?? "", url: urlParts.join("|").trim() };
        })
        .filter((link) => link.label && link.url);

      const payload = {
        title: data.title,
        slug: data.slug,
        summary: data.summary,
        problem: data.problem || undefined,
        solution: data.solution || undefined,
        role: data.role || undefined,
        outcome: data.outcome || undefined,
        stack: stackArray,
        coverImageUrl: data.coverImageUrl.trim() || undefined,
        links,
        year: data.year,
        categorySlug: data.categorySlug,
        featured: data.featured,
        status: data.status,
      };

      const saved = project
        ? (await adminClient.updateProject(project.id, payload)).data
        : (await adminClient.createProject(payload)).data;

      if (coverFile) {
        await adminClient.uploadProjectCover(coverFile, saved.slug);
      }

      router.push("/admin/projects");
      router.refresh();
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
      router.push("/admin/projects");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete project.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="admin-editor">
      <div className="admin-editor-toolbar">
        <div>
        <Link href="/admin/projects" className="admin-editor-back">
          <ArrowLeft className="h-4 w-4" /> Back to projects
        </Link>
        <h1>{project ? "Edit project" : "New project"}</h1>
        </div>
        <div className="admin-editor-actions">
          <button
            type="submit"
            disabled={saving}
            className="admin-primary-button disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Project"}
          </button>
        </div>
      </div>

      {saveError && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {saveError}
        </div>
      )}

      <div className="admin-editor-grid">
        <div className="admin-editor-fields">
          {/* Basic info */}
          <section className="admin-form-section space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Project Info</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-500">Title</label>
                <input {...register("title", { required: true })} aria-label="Title" type="text" placeholder="Payment Gateway & Subscription Platform" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Slug</label>
                <input {...register("slug")} aria-label="Slug" type="text" placeholder="payment-gateway-platform" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Year</label>
                <input {...register("year", { valueAsNumber: true })} aria-label="Year" type="number" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Summary</label>
              <textarea {...register("summary")} aria-label="Summary" rows={2} placeholder="One-paragraph overview of the project…" className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Cover Image or Workflow Path</label>
              {coverPreviewUrl && <Image src={coverPreviewUrl} alt="Current project cover" width={1200} height={675} unoptimized className="admin-cover-preview" />}
              <label className="mb-2 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600 hover:border-blue-400 hover:bg-blue-50">
                <Upload className="h-4 w-4 text-blue-600" />
                <span>{coverFile ? coverFile.name : "Upload an image"}</span>
                <input
                  type="file"
                  aria-label="Upload project cover"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
                  onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)}
                />
              </label>
              <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
                <FileImage className="h-3.5 w-3.5" /> PNG, JPEG, WebP, or GIF up to 8 MB
              </div>
              <input
                {...register("coverImageUrl")}
                aria-label="Cover image or workflow path"
                type="text"
                placeholder="/projects/inosec19.png or https://example.com/image.png"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1 text-xs text-slate-400">Upload a new image, or use a public path/URL as a fallback. A new upload replaces the current image after saving.</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Related Links</label>
              <textarea
                {...register("links")}
                aria-label="Related links"
                rows={3}
                placeholder={'University news | https://example.com/news\nResearch paper | https://example.com/paper'}
                className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1 text-xs text-slate-400">One link per line using: Label | URL</p>
            </div>
          </section>

          {/* Case study content */}
          <section className="admin-form-section space-y-4">
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
                  aria-label={label}
                  rows={3}
                  placeholder={placeholder}
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Tech Stack (comma-separated)</label>
              <input {...register("stack")} aria-label="Tech stack" type="text" placeholder="Node.js, PostgreSQL, Redis, Docker" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="admin-editor-sidebar">
          <section className="admin-form-section space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Settings</h3>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
              <select {...register("status")} aria-label="Status" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none">
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Category</label>
              <select {...register("categorySlug")} aria-label="Category" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none">
                {projectCategories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input {...register("featured")} type="checkbox" id="proj-featured" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <label htmlFor="proj-featured" className="text-sm text-slate-700">Featured project</label>
            </div>
          </section>

          {project && (
            <div className="admin-editor-danger">
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
