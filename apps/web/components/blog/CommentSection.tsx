"use client";

import { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { formatDate } from "@/lib/utils";
import type { Comment } from "@/lib/server-api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface CommentFormData {
  authorName: string;
  authorEmail: string;
  authorWebsite?: string;
  content: string;
}

interface Props {
  postSlug: string;
  postId: string;
  initialComments?: Comment[];
}

function CommentCard({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) {
  return (
    <div className={`${isReply ? "ml-8 border-l-2 border-slate-100 pl-4" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-xs font-bold text-blue-700">
          {comment.authorName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            {comment.authorWebsite ? (
              <a
                href={comment.authorWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-blue-700 hover:underline"
              >
                {comment.authorName}
              </a>
            ) : (
              <span className="text-sm font-semibold text-slate-900">{comment.authorName}</span>
            )}
            <span className="text-xs text-slate-400">{formatDate(comment.createdAt)}</span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">{comment.content}</p>
        </div>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentCard key={reply.id} comment={reply} isReply />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentSection({ postSlug, initialComments = [] }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentFormData>();

  const onSubmit = async (data: CommentFormData) => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/blogs/${postSlug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: data.authorName,
          authorEmail: data.authorEmail,
          authorWebsite: data.authorWebsite || undefined,
          content: data.content,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message ?? "Failed to submit comment.");
      }

      setSubmitted(true);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-12 border-t border-slate-200 pt-8">
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
        <MessageSquare className="h-5 w-5 text-blue-500" />
        {initialComments.length > 0
          ? `${initialComments.length} Comment${initialComments.length !== 1 ? "s" : ""}`
          : "Comments"}
      </h2>

      {/* Approved comments */}
      {initialComments.length > 0 ? (
        <div className="mt-6 space-y-6">
          {initialComments.map((comment) => (
            <CommentCard key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-400">
          No comments yet. Be the first to share your thoughts!
        </p>
      )}

      {/* Submit form */}
      <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h3 className="mb-4 text-sm font-semibold text-slate-700">Leave a Comment</h3>

        {submitted ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <strong>Thanks for your comment!</strong> It&apos;s pending moderation and will appear
            once approved.
            <button
              onClick={() => setSubmitted(false)}
              className="ml-3 font-medium underline hover:no-underline"
            >
              Post another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("authorName", { required: "Name is required" })}
                  type="text"
                  placeholder="Your name"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                {errors.authorName && (
                  <p className="mt-1 text-xs text-red-600">{errors.authorName.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Email <span className="text-red-500">*</span>{" "}
                  <span className="font-normal text-slate-400">(not published)</span>
                </label>
                <input
                  {...register("authorEmail", {
                    required: "Email is required",
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" },
                  })}
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                {errors.authorEmail && (
                  <p className="mt-1 text-xs text-red-600">{errors.authorEmail.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Website <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                {...register("authorWebsite")}
                type="url"
                placeholder="https://yoursite.com"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Comment <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register("content", {
                  required: "Comment is required",
                  minLength: { value: 2, message: "Comment is too short" },
                  maxLength: { value: 5000, message: "Comment is too long" },
                })}
                rows={4}
                placeholder="Share your thoughts, ask a question, or add to the discussion…"
                className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              {errors.content && (
                <p className="mt-1 text-xs text-red-600">{errors.content.message}</p>
              )}
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <p className="text-xs text-slate-400">
              Comments are moderated and will appear after approval.
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {submitting ? "Submitting…" : "Submit Comment"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
