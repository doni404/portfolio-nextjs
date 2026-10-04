import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Rss } from "lucide-react";
import { publicApi } from "@/lib/server-api";
import { buildMetadata, siteConfig } from "@/lib/metadata";
import { JsonLd } from "@/components/seo/JsonLd";
import { articleSchema, breadcrumbs } from "@/lib/seo";
import { mediaUrl } from "@/lib/media";
import { articleContent } from "@/lib/article-content";
import { formatDate } from "@/lib/utils";
import { ArticleMeta } from "@/components/public/ArticleMeta";
import { CommentSection } from "@/components/blog/CommentSection";
import { ShareButton } from "@/components/blog/ShareButton";
import { ReadingTools } from "@/components/blog/ReadingTools";
import { BlogViewAnalytics } from "@/components/analytics/BlogViewAnalytics";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = (await publicApi.getBlog(slug))?.data;
  if (!post)
    return buildMetadata({
      title: "Article Not Found",
      path: `/blogs/${slug}`,
      noIndex: true,
    });
  return buildMetadata({
    title: post.seoTitle?.trim() || post.title,
    description: post.seoDescription?.trim() || post.excerpt,
    path: `/blogs/${post.slug}`,
    imageTitle: post.title,
    imageDescription: post.excerpt,
    image: mediaUrl(post.coverImageUrl),
    type: "article",
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    tags: post.tags.map((t) => t.name),
    authorName: post.author?.name,
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
  const content = articleContent(post.content);
  const others = (allPostsRes?.data ?? []).filter((p) => p.id !== post.id);
  const related = [
    ...others.filter((p) => p.category?.slug === post.category?.slug),
    ...others.filter((p) => p.category?.slug !== post.category?.slug),
  ].slice(0, 3);
  const cover = mediaUrl(post.coverImageUrl);
  return (
    <div className="reader-page" id="article-top">
      <JsonLd data={[
        articleSchema(post),
        breadcrumbs([{ name: "Home", path: "/" }, { name: "Journal", path: "/blogs" }, { name: post.title, path: `/blogs/${post.slug}` }]),
      ]} />
      <BlogViewAnalytics
        slug={post.slug}
        title={post.title}
        category={post.category?.name}
      />
      <header className="reader-header site-container">
        <Link href="/blogs" className="text-link">
          <ArrowLeft size={16} /> The journal
        </Link>
        <p className="article-category">
          {post.category?.name ?? "Engineering"}
        </p>
        <h1>{post.title}</h1>
        <p className="reader-deck">{post.excerpt}</p>
        <div className="reader-byline">
          <Link href="/about" className="reader-author">
            <Image
              src="/brand/doni-portrait.png"
              alt=""
              width={40}
              height={40}
            />
            <span>
              {post.author?.name ?? siteConfig.name}
              <small>Cloud architect &amp; backend engineer</small>
            </span>
          </Link>
          <div className="reader-meta-actions">
            <ArticleMeta post={post} />
            <ShareButton
              title={post.title}
              text={post.excerpt}
              itemId={post.slug}
            />
          </div>
        </div>
        {cover && (
          <figure className="reader-cover">
            <Image
              src={cover}
              width={1440}
              height={810}
              alt={`Conceptual illustration for ${post.title}`}
              unoptimized={cover.includes("/uploads/")}
              preload
              sizes="(max-width: 767px) 100vw, 1100px"
            />
            <figcaption>Editorial illustration</figcaption>
          </figure>
        )}
      </header>
      <div className="site-container reading-layout">
        <ReadingTools headings={content.headings} />
        <div className="reading-main">
          <article
            id="reading-content"
            className="prose reading-prose"
            dangerouslySetInnerHTML={{ __html: content.html }}
          />
          <div className="reader-tags">
            {post.tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/blogs?q=${encodeURIComponent(tag.name)}`}
              >
                #{tag.name}
              </Link>
            ))}
          </div>
          <div className="reader-endnote">
            <p>
              Written by{" "}
              <Link href="/about">{post.author?.name ?? siteConfig.name}</Link>.
            </p>
            <p>
              Updated {formatDate(post.updatedAt)}. Engineering notes, not
              one-size-fits-all prescriptions.
            </p>
            <a href="/rss.xml" className="text-link">
              <Rss size={15} /> Follow the journal
            </a>
          </div>
          <CommentSection
            postSlug={post.slug}
            postId={post.id}
            initialComments={commentsRes?.data ?? []}
          />
        </div>
      </div>
      {related.length > 0 && (
        <section className="reader-related site-container">
          <div className="journal-results-heading">
            <h2>Keep reading</h2>
            <Link href="/blogs" className="text-link">
              All articles <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="related-stories">
            {related.map((item) => (
              <Link key={item.id} href={`/blogs/${item.slug}`}>
                {item.coverImageUrl && (
                  <Image
                    src={mediaUrl(item.coverImageUrl)!}
                    alt=""
                    width={480}
                    height={270}
                    unoptimized
                    sizes="(max-width: 767px) 100vw, 360px"
                  />
                )}
                <p className="article-category">{item.category?.name}</p>
                <h3>{item.title}</h3>
                <ArticleMeta post={item} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
