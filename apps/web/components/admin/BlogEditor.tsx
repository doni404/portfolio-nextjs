"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Save, Eye, Send, FileText, Trash2 } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import type { BlogPost } from "@/lib/server-api";
import { adminClient } from "@/lib/admin-api";
import { Badge } from "@/components/ui/Badge";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { marked } from "marked";
import { siteConfig } from "@/lib/metadata";

const blogCategories = [
  { label: "AI & Technology", slug: "ai-news" },
  { label: "Backend Engineering", slug: "backend-engineering" },
  { label: "Cloud & DevOps", slug: "cloud-devops" },
  { label: "Payment Systems", slug: "payment-systems" },
  { label: "AI & LLM", slug: "ai-llm" },
  { label: "Machine Learning", slug: "machine-learning" },
  { label: "Career & Japan", slug: "career-japan" },
  { label: "Japan Life", slug: "japan-life" },
  { label: "Tutorials", slug: "tutorials" },
];

interface BlogEditorProps {
  post?: BlogPost;
}

interface BlogFormData {
  title: string;
  slug: string;
  excerpt: string;
  categorySlug: string;
  tags: string;
  coverImageUrl: string;
  storyDate: string;
  seoTitle: string;
  seoDescription: string;
  readingTimeMinutes: number;
  featured: boolean;
  status: "draft" | "published" | "archived";
}

function isMarkdown(content: string): boolean {
  return /^#{1,6}\s|^\*\*|^__|\*[^*]|_[^_]|^\s*[-*+]\s|^\s*\d+\.\s|^```|^\s*>/m.test(content);
}

function prepareInitialContent(content: string | undefined): string {
  if (!content) return "";
  if (isMarkdown(content)) {
    return marked.parse(content) as string;
  }
  return content;
}

export function BlogEditor({ post }: BlogEditorProps) {

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "seo" | "preview">("content");
  const [editorContent, setEditorContent] = useState<string>(() =>
    prepareInitialContent(post?.content)
  );
  const [saveError, setSaveError] = useState("");
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const needsReview = Boolean(post?.editorialMeta?.aiAssisted && post.status !== "published");

  const { register, handleSubmit, control, setValue } = useForm<BlogFormData>({
    defaultValues: {
      title: post?.title ?? "",
      slug: post?.slug ?? "",
      excerpt: post?.excerpt ?? "",
      categorySlug: post?.category?.slug ?? blogCategories[0].slug,
      tags: post?.tags?.map((t) => t.name).join(", ") ?? "",
      coverImageUrl: post?.coverImageUrl ?? "",
      storyDate: post?.storyDate?.slice(0, 10) ?? "",
      seoTitle: post?.seoTitle ?? "",
      seoDescription: post?.seoDescription ?? "",
      readingTimeMinutes: post?.readingTimeMinutes ?? 5,
      featured: post?.featured ?? false,
      status: post?.status ?? "draft",
    },
  });

  const formValues = useWatch({ control });
  const titleValue = formValues.title;
  const tagsValue = formValues.tags;

  function autoSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  const onSubmit = async (data: BlogFormData) => {
    if (needsReview && data.status === "published" && !reviewConfirmed) {
      setSaveError("Review the sources and content, then confirm your review before publishing.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const tagNames = data.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: editorContent,
        status: data.status,
        featured: data.featured,
        categorySlug: data.categorySlug,
        tags: tagNames,
        coverImageUrl: data.coverImageUrl || "",
        storyDate: data.storyDate || null,
        reviewConfirmed,
        seoTitle: data.seoTitle || undefined,
        seoDescription: data.seoDescription || undefined,
        readingTimeMinutes: data.readingTimeMinutes,
      };

      if (post) {
        await adminClient.updateBlog(post.id, payload);
      } else {
        await adminClient.createBlog(payload);
      }

      // Hard navigation clears the Next.js router cache so the list always shows fresh data
      window.location.assign("/admin/blogs");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save post.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) return;
    setDeleting(true);
    try {
      await adminClient.deleteBlog(post.id);
      window.location.assign("/admin/blogs");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete post.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="admin-editor">
      {/* Toolbar */}
      <div className="admin-editor-toolbar">
        <div>
        <Link
          href="/admin/blogs"
          className="admin-editor-back"
        >
          <ArrowLeft className="h-4 w-4" /> Back to posts
        </Link>
        <h1>{post ? "Edit post" : "New post"}</h1>
        </div>
        <div className="admin-editor-actions">
          {post?.status === "published" && (
            <Link
              href={`/blogs/${post.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Eye className="h-4 w-4" /> View Live
            </Link>
          )}
          <button
            type="submit"
            onClick={() => setValue("status", "draft")}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {saving ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save Draft
          </button>
          <button
            type="submit"
            onClick={() => setValue("status", "published")}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Publish
          </button>
        </div>
      </div>

      {saveError && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {saveError}
        </div>
      )}
      {needsReview && <div className="admin-notice">
        <p>This AI-assisted draft is not live. Verify its sources, dates, claims, and cover; add your own perspective.</p>
        <label className="admin-switch-label"><input type="checkbox" checked={reviewConfirmed} onChange={(event) => setReviewConfirmed(event.target.checked)} />I have reviewed this draft for publication.</label>
      </div>}

      <div className="admin-editor-grid">
        {/* Main editor area */}
        <div className="admin-editor-fields">
          {/* Title & Slug */}
          <div className="admin-editor-title">
            <textarea
              {...register("title", { required: true })}
              aria-label="Post title"
              rows={2}
              placeholder="Post title…"
              onChange={(e) => {
                setValue("title", e.target.value);
                if (!post) setValue("slug", autoSlug(e.target.value));
              }}
              className="admin-post-title w-full border-none text-2xl font-bold text-slate-900 placeholder-slate-300 outline-none focus:ring-0"
            />
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
              <span className="font-medium">Slug:</span>
              <input
                {...register("slug")}
                aria-label="Slug"
                type="text"
                className="flex-1 rounded border-none bg-slate-50 px-1.5 py-0.5 font-mono text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
            </div>
          </div>

          {/* Tab switcher */}
          <div className="admin-editor-tabs" role="tablist" aria-label="Post editor">
            {(["content", "seo", "preview"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                tabIndex={activeTab === tab ? 0 : -1}
                aria-selected={activeTab === tab}
                aria-controls={`editor-${tab}`}
                id={`tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                onKeyDown={(event) => {
                  const tabs = ["content", "seo", "preview"] as const;
                  const index = tabs.indexOf(tab);
                  const next = event.key === "ArrowRight" ? (index + 1) % tabs.length
                    : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length
                    : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1;
                  if (next < 0) return;
                  event.preventDefault();
                  setActiveTab(tabs[next]);
                  document.getElementById(`tab-${tabs[next]}`)?.focus();
                }}
              >
                {tab === "seo" ? "SEO & Meta" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content tab */}
          {activeTab === "content" && (
            <div id="editor-content" role="tabpanel" aria-labelledby="tab-content" className="space-y-4">
              <div className="pb-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Excerpt
                </label>
                <textarea
                  {...register("excerpt")}
                  aria-label="Excerpt"
                  rows={2}
                  placeholder="Short description shown in article cards and search results…"
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Appears on blog listing cards and social previews. Keep under 160 characters.
                </p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Content
                  </label>
                </div>
                <RichTextEditor
                  content={editorContent}
                  onChange={setEditorContent}
                  placeholder="Start writing your article..."
                  minHeight="480px"
                />
              </div>
            </div>
          )}

          {/* SEO tab */}
          {activeTab === "seo" && (
            <div id="editor-seo" role="tabpanel" aria-labelledby="tab-seo" className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">SEO Title</label>
                <input
                  {...register("seoTitle")}
                  aria-label="SEO Title"
                  type="text"
                  placeholder={titleValue || "SEO-optimized title (max 60 chars)"}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <p className="mt-1 text-xs text-slate-400">
                  {formValues.seoTitle?.length ?? 0} / 60 characters
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">SEO Description</label>
                <textarea
                  {...register("seoDescription")}
                  aria-label="SEO Description"
                  rows={3}
                  placeholder="Meta description for search engines (max 160 chars)…"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm resize-none focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <p className="mt-1 text-xs text-slate-400">
                  {formValues.seoDescription?.length ?? 0} / 160 characters
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Cover Image URL</label>
                <input
                  {...register("coverImageUrl")}
                  aria-label="Cover Image URL"
                  type="text"
                  placeholder="https://… or /uploads/blogs/…"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* SERP Preview */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Search Preview
                </p>
                <p className="text-sm font-medium text-blue-700 truncate">
                  {formValues.seoTitle || titleValue || "Post title"}
                </p>
                <p className="text-xs text-emerald-700">
                  {siteConfig.url}/blogs/{formValues.slug || "post-slug"}
                </p>
                <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                  {formValues.seoDescription || formValues.excerpt || "Meta description will appear here…"}
                </p>
              </div>
            </div>
          )}

          {/* Preview tab */}
          {activeTab === "preview" && (
            <div id="editor-preview" role="tabpanel" aria-labelledby="tab-preview" className="overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50 px-5 py-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-600">Article Preview</span>
              </div>
              <div className="py-6">
                <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  {titleValue || "Article Title"}
                </h2>
                {formValues.excerpt && (
                  <p className="mt-3 text-lg text-slate-500">{formValues.excerpt}</p>
                )}
                <div className="admin-editor-preview-meta mt-4 flex items-center gap-3 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <Image src="/profile.png" alt="Doni Putra" width={28} height={28} className="h-7 w-7 rounded-full object-cover" />
                    <span>Doni Putra Purbawa</span>
                  </div>
                  <span>·</span>
                  <span>{formValues.readingTimeMinutes} min read</span>
                </div>
                <div className="mt-6 border-t border-slate-100 pt-6">
                  {editorContent ? (
                    <div
                      className="prose prose-slate max-w-none prose-headings:font-bold prose-a:text-blue-600 prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-blockquote:border-l-4 prose-blockquote:border-blue-400"
                      dangerouslySetInnerHTML={{ __html: editorContent }}
                    />
                  ) : (
                    <p className="text-slate-400 italic">No content yet. Start writing in the Content tab.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="admin-editor-sidebar">
          {/* Status & publish */}
          <section className="admin-form-section">
            <h3 className="mb-4 text-sm font-semibold text-slate-700">Publish Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">Status</label>
                <select
                  {...register("status")}
                  aria-label="Status"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  {...register("featured")}
                  type="checkbox"
                  id="featured"
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="featured" className="text-sm text-slate-700">
                  Featured article
                </label>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">Story date</label>
                <input {...register("storyDate")} aria-label="Story date" type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  Reading Time (minutes)
                </label>
                <input
                  {...register("readingTimeMinutes", { valueAsNumber: true })}
                  aria-label="Reading time in minutes"
                  type="number"
                  min={1}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* Category & Tags */}
          <section className="admin-form-section">
            <h3 className="mb-4 text-sm font-semibold text-slate-700">Category & Tags</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">Category</label>
                <select
                  {...register("categorySlug")}
                  aria-label="Category"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none"
                >
                  {blogCategories.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  Tags (comma-separated)
                </label>
                <input
                  {...register("tags")}
                  aria-label="Tags"
                  type="text"
                  placeholder="Node.js, AWS, PostgreSQL"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>
              {tagsValue && (
                <div className="flex flex-wrap gap-1.5">
                  {tagsValue
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((tag) => (
                      <Badge key={tag} variant="gray">{tag}</Badge>
                    ))}
                </div>
              )}
            </div>
          </section>

          {/* Danger zone */}
          {post && (
            <div className="admin-editor-danger">
              <h3 className="mb-3 text-sm font-semibold text-red-700">Danger Zone</h3>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? "Deleting…" : "Delete Post"}
              </button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
