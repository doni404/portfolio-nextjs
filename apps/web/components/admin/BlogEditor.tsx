"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Eye, Send, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import type { BlogPost } from "@/lib/mock-data";
import { categories } from "@/lib/mock-data";
import { Badge } from "@/components/ui/Badge";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { marked } from "marked";

interface BlogEditorProps {
  post?: BlogPost;
}

interface BlogFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string;
  coverImage: string;
  seoTitle: string;
  seoDescription: string;
  readingTime: number;
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
  const [activeTab, setActiveTab] = useState<"content" | "seo" | "preview">("content");
  const [editorContent, setEditorContent] = useState<string>(() =>
    prepareInitialContent(post?.content)
  );

  const { register, handleSubmit, watch, setValue, getValues } = useForm<BlogFormData>({
    defaultValues: {
      title: post?.title ?? "",
      slug: post?.slug ?? "",
      excerpt: post?.excerpt ?? "",
      content: post?.content ?? "",
      category: post?.category ?? categories[0],
      tags: post?.tags?.join(", ") ?? "",
      coverImage: post?.coverImage ?? "",
      seoTitle: post?.seoTitle ?? "",
      seoDescription: post?.seoDescription ?? "",
      readingTime: post?.readingTime ?? 5,
      featured: post?.featured ?? false,
      status: post?.status ?? "draft",
    },
  });

  const titleValue = watch("title");
  const tagsValue = watch("tags");

  function autoSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  const onSubmit = async (data: BlogFormData) => {
    setSaving(true);
    // Merge in the rich text editor HTML content
    const payload = { ...data, content: editorContent };
    await new Promise((r) => setTimeout(r, 800));
    console.log("Save blog post:", payload);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/blogs"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to posts
        </Link>
        <div className="flex items-center gap-2">
          {post?.status === "published" && (
            <Link
              href={`/blogs/${post.slug}`}
              target="_blank"
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main editor area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Title & Slug */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <input
              {...register("title", { required: true })}
              type="text"
              placeholder="Post title…"
              onChange={(e) => {
                setValue("title", e.target.value);
                if (!post) setValue("slug", autoSlug(e.target.value));
              }}
              className="w-full border-none text-2xl font-bold text-slate-900 placeholder-slate-300 outline-none focus:ring-0"
            />
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
              <span className="font-medium">Slug:</span>
              <input
                {...register("slug")}
                type="text"
                className="flex-1 rounded border-none bg-slate-50 px-1.5 py-0.5 font-mono text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 w-fit">
            {(["content", "seo", "preview"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab === "seo" ? "SEO & Meta" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content tab — rich text editor */}
          {activeTab === "content" && (
            <div className="space-y-4">
              {/* Excerpt */}
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Excerpt
                </label>
                <textarea
                  {...register("excerpt")}
                  rows={2}
                  placeholder="Short description shown in article cards and search results…"
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Appears on blog listing cards and social previews. Keep under 160 characters.
                </p>
              </div>

              {/* Rich text editor */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Content
                  </label>
                  <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    Rich Text Editor
                  </span>
                </div>
                <RichTextEditor
                  content={editorContent}
                  onChange={setEditorContent}
                  placeholder="Start writing your article… Use / for blocks, or the toolbar above."
                  minHeight="480px"
                />
              </div>
            </div>
          )}

          {/* SEO tab */}
          {activeTab === "seo" && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">SEO Title</label>
                <input
                  {...register("seoTitle")}
                  type="text"
                  placeholder={titleValue || "SEO-optimized title (max 60 chars)"}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <p className="mt-1 text-xs text-slate-400">
                  {watch("seoTitle")?.length ?? 0} / 60 characters
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">SEO Description</label>
                <textarea
                  {...register("seoDescription")}
                  rows={3}
                  placeholder="Meta description for search engines (max 160 chars)…"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm resize-none focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <p className="mt-1 text-xs text-slate-400">
                  {watch("seoDescription")?.length ?? 0} / 160 characters
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Cover Image URL</label>
                <input
                  {...register("coverImage")}
                  type="url"
                  placeholder="https://… or /images/…"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <p className="mt-1 text-xs text-slate-400">Used as OG image and article header.</p>
              </div>

              {/* SERP Preview */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Search Preview
                </p>
                <p className="text-sm font-medium text-blue-700 truncate">
                  {watch("seoTitle") || watch("title") || "Post title"}
                </p>
                <p className="text-xs text-emerald-700">
                  https://doniputrapurbawa.com/blogs/{watch("slug") || "post-slug"}
                </p>
                <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                  {watch("seoDescription") || watch("excerpt") || "Meta description will appear here…"}
                </p>
              </div>
            </div>
          )}

          {/* Preview tab */}
          {activeTab === "preview" && (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50 px-5 py-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-600">Article Preview</span>
              </div>
              <div className="p-6 lg:p-8">
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  {titleValue || "Article Title"}
                </h1>
                {watch("excerpt") && (
                  <p className="mt-3 text-lg text-slate-500">{watch("excerpt")}</p>
                )}
                <div className="mt-4 flex items-center gap-3 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <img src="/profile.png" alt="Doni Putra" className="h-7 w-7 rounded-full object-cover" />
                    <span>Doni Putra Purbawa</span>
                  </div>
                  <span>·</span>
                  <span>{watch("readingTime")} min read</span>
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
        <div className="space-y-4">
          {/* Status & publish */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-700">Publish Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">Status</label>
                <select
                  {...register("status")}
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
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  Reading Time (minutes)
                </label>
                <input
                  {...register("readingTime", { valueAsNumber: true })}
                  type="number"
                  min={1}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Category & Tags */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-700">Category & Tags</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">Category</label>
                <select
                  {...register("category")}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  Tags (comma-separated)
                </label>
                <input
                  {...register("tags")}
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
          </div>

          {/* Editor info */}
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <h3 className="mb-2 text-xs font-semibold text-blue-700">Editor Features</h3>
            <ul className="space-y-1">
              {[
                "Headings H1–H3",
                "Bold, italic, underline",
                "Code & code blocks",
                "Syntax highlighting",
                "Bullet & numbered lists",
                "Blockquotes",
                "Links & images",
                "Text alignment",
                "Highlights",
                "Horizontal rules",
              ].map((f) => (
                <li key={f} className="flex items-center gap-1.5 text-xs text-blue-700">
                  <span className="h-1 w-1 rounded-full bg-blue-400" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {post && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-5">
              <h3 className="mb-3 text-sm font-semibold text-red-700">Danger Zone</h3>
              <button
                type="button"
                className="w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                Delete Post
              </button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
