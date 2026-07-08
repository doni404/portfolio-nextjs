"use client";

import { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { useForm } from "react-hook-form";

interface CommentForm {
  authorName: string;
  authorEmail: string;
  content: string;
}

interface CommentSectionProps {
  postSlug: string;
  postId: string;
}

const mockApprovedComments = [
  {
    id: "c1",
    authorName: "Alex Chen",
    content:
      "Great article! The idempotency pattern using event IDs saved us from double-billing issues in production.",
    createdAt: "2024-03-16",
  },
];

export function CommentSection({ postSlug, postId }: CommentSectionProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentForm>();

  const onSubmit = async (data: CommentForm) => {
    setSubmitting(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 800));
    console.log("Comment submitted:", { postId, postSlug, ...data });
    setSubmitting(false);
    setSubmitted(true);
    reset();
  };

  return (
    <div className="mt-12 border-t border-slate-200 pt-10">
      <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
        <MessageSquare className="h-5 w-5 text-blue-600" />
        Comments ({mockApprovedComments.length})
      </h2>

      {/* Existing comments */}
      <div className="mb-8 space-y-4">
        {mockApprovedComments.map((comment) => (
          <div key={comment.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-300 text-sm font-semibold text-slate-700">
                  {comment.authorName.charAt(0)}
                </div>
                <span className="font-medium text-slate-900">{comment.authorName}</span>
              </div>
              <time className="text-xs text-slate-400">{comment.createdAt}</time>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{comment.content}</p>
          </div>
        ))}
      </div>

      {/* Comment form */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 font-semibold text-slate-900">Leave a Comment</h3>

        {submitted ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
            <p className="font-medium text-emerald-800">Thank you for your comment!</p>
            <p className="mt-1 text-sm text-emerald-600">
              It will appear after moderation review.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-3 text-sm font-medium text-emerald-700 hover:underline"
            >
              Post another comment
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("authorName", { required: "Name is required" })}
                  type="text"
                  placeholder="Your name"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                {errors.authorName && (
                  <p className="mt-1 text-xs text-red-600">{errors.authorName.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("authorEmail", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Invalid email address",
                    },
                  })}
                  type="email"
                  placeholder="your@email.com (not published)"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                {errors.authorEmail && (
                  <p className="mt-1 text-xs text-red-600">{errors.authorEmail.message}</p>
                )}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Comment <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register("content", {
                  required: "Comment is required",
                  minLength: { value: 10, message: "Comment must be at least 10 characters" },
                })}
                rows={4}
                placeholder="Share your thoughts..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              {errors.content && (
                <p className="mt-1 text-xs text-red-600">{errors.content.message}</p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Comments are reviewed before appearing publicly.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Post Comment
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
