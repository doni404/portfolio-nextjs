import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Tag } from "lucide-react";
import { marked } from "marked";
import { publicApi } from "@/lib/server-api";
import { buildMetadata } from "@/lib/metadata";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { CommentSection } from "@/components/blog/CommentSection";
import { ShareButton } from "@/components/blog/ShareButton";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const res = await publicApi.getBlog(slug);
  const post = res?.data;
  if (!post) {
    return buildMetadata({
      title: "Article Not Found",
      description: "The requested blog article could not be found.",
      path: `/blogs/${slug}`,
      noIndex: true,
    });
  }

  const description = post.seoDescription ?? post.excerpt;
  return buildMetadata({
    title: post.seoTitle ?? post.title,
    description,
    path: `/blogs/${post.slug}`,
    imageTitle: post.title,
    imageDescription: description,
    type: "article",
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    tags: post.tags.map((t) => t.name),
  });
}


export default async function BlogDetail({ params }: PageProps) {
  const { slug } = await params;
  const [postRes, commentsRes, allPostsRes] = await Promise.all([
    publicApi.getBlog(slug),
    publicApi.getComments(slug),
    publicApi.getBlogs({ pageSize: "50" }),
  ]);

  const post = postRes?.data;
  if (!post) notFound();

  const approvedComments = commentsRes?.data ?? [];
  const allPosts = allPostsRes?.data ?? [];

  const contentHtml = marked.parse(post.content) as string;

  const relatedPosts = allPosts
    .filter((p) => p.id !== post.id && p.category?.slug === post.category?.slug)
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
            {post.category && <Badge variant="blue">{post.category.name}</Badge>}
            {post.tags.map((tag) => (
              <Badge key={tag.id} variant="gray">
                <Tag className="mr-1 h-3 w-3" />
                {tag.name}
              </Badge>
            ))}
          </div>

          <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-3 text-lg text-slate-500">{post.excerpt}</p>

          <div className="mt-5 grid gap-3 text-sm text-slate-500 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <div className="flex min-w-0 items-center gap-2">
              <Image
                src="/profile.png"
                alt="Doni Putra Purbawa"
                width={32}
                height={32}
                className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
              />
              <span className="truncate font-medium text-slate-700">Doni Putra Purbawa</span>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 text-[13px] min-[380px]:text-sm sm:flex sm:gap-4">
              {post.publishedAt && (
                <span className="inline-flex min-w-0 items-center gap-1 whitespace-nowrap">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="truncate">{formatDate(post.publishedAt)}</span>
                </span>
              )}
              <span className="inline-flex min-w-0 items-center gap-1 whitespace-nowrap">
                <Clock className="h-3.5 w-3.5" />
                <span className="truncate">{post.readingTimeMinutes} min read</span>
              </span>
              <ShareButton
                title={post.title}
                text={post.excerpt}
                className="justify-self-start text-slate-400 hover:text-slate-700"
              />
            </div>
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
              key={tag.id}
              href={`/blogs?q=${encodeURIComponent(tag.name)}`}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
            >
              #{tag.name}
            </Link>
          ))}
        </div>

        {/* Author bio */}
        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-6">
          <div className="flex items-start gap-4">
            <Image
              src="/profile.png"
              alt="Doni Putra Purbawa"
              width={56}
              height={56}
              className="h-14 w-14 flex-shrink-0 rounded-xl object-cover"
            />
            <div>
              <h3 className="font-semibold text-slate-900">Doni Putra Purbawa</h3>
              <p className="text-sm text-blue-600">
                Cloud Architect & Senior Backend Engineer | AWS, Fintech, Cloud & AI
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Designing reliable AWS cloud architecture, fintech platforms, and AI-powered
                backend systems. Based in Indonesia, open to Japan relocation.
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
                    {related.category?.name ?? "Article"}
                  </Badge>
                  <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 line-clamp-2">
                    {related.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">{related.readingTimeMinutes} min read</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <CommentSection postSlug={post.slug} postId={post.id} initialComments={approvedComments} />
      </div>
    </div>
  );
}
