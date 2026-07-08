import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Tag, Share2 } from "lucide-react";
import { marked } from "marked";
import { blogPosts } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { CommentSection } from "@/components/blog/CommentSection";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug && p.status === "published");
  if (!post) return { title: "Not Found" };
  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      tags: post.tags,
    },
  };
}

export function generateStaticParams() {
  return blogPosts
    .filter((p) => p.status === "published")
    .map((p) => ({ slug: p.slug }));
}


export default async function BlogDetail({ params }: PageProps) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug && p.status === "published");
  if (!post) notFound();

  const contentHtml = marked.parse(post.content) as string;

  const relatedPosts = blogPosts
    .filter(
      (p) => p.status === "published" && p.id !== post.id && p.category === post.category
    )
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      {/* Article header */}
      <div className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <Link
            href="/blogs"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" /> Back to blogs
          </Link>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="blue">{post.category}</Badge>
            {post.tags.map((tag) => (
              <Badge key={tag} variant="gray">
                <Tag className="mr-1 h-3 w-3" />
                {tag}
              </Badge>
            ))}
          </div>

          <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-3 text-lg text-slate-500">{post.excerpt}</p>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-slate-500">
              {/* Author */}
              <div className="flex items-center gap-2">
                <img
                  src="/profile.png"
                  alt="Doni Putra Purbawa"
                  className="h-8 w-8 rounded-full object-cover"
                />
                <span className="font-medium text-slate-700">Doni Putra Purbawa</span>
              </div>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(post.publishedAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {post.readingTime} min read
              </span>
            </div>
            <button className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-700">
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>
        </div>
      </div>

      {/* Article body */}
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <article
          className="prose prose-slate max-w-none
            prose-headings:font-bold prose-headings:text-slate-900
            prose-p:text-slate-700 prose-p:leading-relaxed
            prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
            prose-code:rounded prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-slate-800
            prose-pre:bg-slate-900 prose-pre:text-slate-100
            prose-blockquote:border-l-blue-500 prose-blockquote:text-slate-600
            prose-ul:text-slate-700 prose-ol:text-slate-700
            prose-li:marker:text-blue-500"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        {/* Tags */}
        <div className="mt-10 flex flex-wrap gap-2 border-t border-slate-200 pt-6">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/blogs?q=${encodeURIComponent(tag)}`}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
            >
              #{tag}
            </Link>
          ))}
        </div>

        {/* Author bio */}
        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-6">
          <div className="flex items-start gap-4">
            <img
              src="/profile.png"
              alt="Doni Putra Purbawa"
              className="h-14 w-14 flex-shrink-0 rounded-xl object-cover"
            />
            <div>
              <h3 className="font-semibold text-slate-900">Doni Putra Purbawa</h3>
              <p className="text-sm text-blue-600">Senior Backend Engineer</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Building reliable fintech, cloud, and AI-powered backend systems. Based in
                Indonesia, open to Japan relocation.
              </p>
              <Link
                href="/about"
                className="mt-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View full profile →
              </Link>
            </div>
          </div>
        </div>

        {/* Related articles */}
        {relatedPosts.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-5 text-lg font-bold text-slate-900">Related Articles</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((related) => (
                <Link
                  key={related.id}
                  href={`/blogs/${related.slug}`}
                  className="group rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-200 hover:shadow-sm"
                >
                  <Badge variant="blue" className="mb-2">
                    {related.category}
                  </Badge>
                  <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 line-clamp-2">
                    {related.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">{related.readingTime} min read</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <CommentSection postSlug={post.slug} postId={post.id} />
      </div>
    </div>
  );
}
