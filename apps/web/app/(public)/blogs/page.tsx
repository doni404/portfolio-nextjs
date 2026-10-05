import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, Rss, Search } from "lucide-react";
import { publicApi } from "@/lib/server-api";
import { blogIndexMetadata, blogPage, normalizeBlogParams, type BlogIndexParams } from "@/lib/seo";
import { BlogSearch } from "@/components/blog/BlogSearch";
import { ArticleMeta } from "@/components/public/ArticleMeta";

export async function generateMetadata({ searchParams }: { searchParams: Promise<BlogIndexParams> }): Promise<Metadata> {
  return blogIndexMetadata(await searchParams);
}

const defaultCategories = [
  "Backend Engineering",
  "Cloud & DevOps",
  "Payment Systems",
  "AI & LLM",
  "Machine Learning",
  "Career & Japan",
  "Tutorials",
  "Japan Life",
];

export default async function Blogs({
  searchParams,
}: {
  searchParams: Promise<BlogIndexParams>;
}) {
  const params = normalizeBlogParams(await searchParams);
  const page = blogPage(params.page);
  const currentYear = new Date().getUTCFullYear();
  const years = Array.from({ length: Math.max(1, currentYear - 2024 + 1) }, (_, index) => String(currentYear - index));
  const allRes = await publicApi.getBlogs({ pageSize: "50" });
  const allPosts = allRes?.data ?? [];
  const categories = [
    ...new Set([
      ...(allPosts.length ? [] : defaultCategories),
      ...allPosts.flatMap((post) =>
        post.category ? [post.category.name] : [],
      ),
    ]),
  ];
  const apiParams: Record<string, string> = {
    pageSize: "20",
    page: String(page),
  };
  if (params.category)
    apiParams.category =
      allPosts.find(
        (post) =>
          post.category?.name === params.category ||
          post.category?.slug === params.category,
      )?.category?.slug ??
      params.category
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
  if (params.q) apiParams.q = params.q;
  if (params.year) apiParams.year = params.year;
  const filteredRes = await publicApi.getBlogs(apiParams);
  const posts = filteredRes?.data ?? [];
  const featured =
    !params.category && !params.q && !params.year && page === 1
      ? posts.find((post) => post.featured)
      : undefined;
  const totalPages = filteredRes?.pagination.totalPages ?? 1;
  if (filteredRes && page > Math.max(1, totalPages)) notFound();

  function href(category?: string, targetPage = 1) {
    const query = new URLSearchParams();
    if (category) query.set("category", category);
    if (params.q) query.set("q", params.q);
    if (params.year) query.set("year", params.year);
    if (targetPage > 1) query.set("page", String(targetPage));
    return `/blogs${query.size ? `?${query}` : ""}`;
  }

  return (
    <div className="journal-page">
      <section className="page-masthead">
        <div className="site-container journal-masthead">
          <div>
            <p className="eyebrow">The journal</p>
            <h1>
              Stay curious<span>.</span>
            </h1>
            <p>
              Ideas and practical perspectives on AI, technology,
              <br />
              engineering, and everyday life in Japan.
            </p>
          </div>
          <div className="journal-search">
            <BlogSearch key={params.q ?? ""} defaultValue={params.q} />
            <a href="/rss.xml" className="text-link">
              <Rss size={14} /> Follow via RSS
            </a>
          </div>
        </div>
      </section>
      <div className="site-container journal-body">
        <nav className="journal-categories" aria-label="Article categories">
          <Link
            href={href()}
            aria-current={!params.category ? "page" : undefined}
          >
            All articles
          </Link>
          {categories.map((category) => (
            <Link
              key={category}
              href={href(category)}
              aria-current={params.category === category ? "page" : undefined}
            >
              {category}
            </Link>
          ))}
        </nav>
        <nav className="journal-years" aria-label="Story year">
          <Link href={(() => { const q = new URLSearchParams(); if (params.category) q.set("category", params.category); if (params.q) q.set("q", params.q); return `/blogs${q.size ? `?${q}` : ""}`; })()} aria-current={!params.year ? "page" : undefined}>All years</Link>
          {years.map((year) => { const q = new URLSearchParams(); q.set("year", year); if (params.category) q.set("category", params.category); if (params.q) q.set("q", params.q); return <Link key={year} href={`/blogs?${q}`} aria-current={params.year === year ? "page" : undefined}>{year}</Link>; })}
        </nav>
        {featured && (
          <Link href={`/blogs/${featured.slug}`} className="featured-story">
            {featured.coverImageUrl && (
              <Image
                src={featured.coverImageUrl}
                width={1200}
                height={630}
                alt={featured.title}
                unoptimized={featured.coverImageUrl.includes("/uploads/")}
                className="article-cover"
                sizes="(max-width: 767px) 100vw, 700px"
              />
            )}
            <div>
              <p className="eyebrow">
                Editor&apos;s pick <span>{featured.category?.name}</span>
              </p>
              <h2>{featured.title}</h2>
              <p>{featured.excerpt}</p>
              <ArticleMeta post={featured} />
              <span className="text-link">
                Read the story <ArrowUpRight size={17} />
              </span>
            </div>
          </Link>
        )}
        <div className="journal-results-heading">
          <h2>
            {params.q
              ? `Results for "${params.q}"`
              : (params.category ?? "Latest articles")}
          </h2>
          <span>{filteredRes?.pagination.total ?? posts.length} articles</span>
        </div>
        <div className="article-index">
          {posts
            .filter((post) => post.id !== featured?.id)
            .map((post) => (
              <Link
                key={post.id}
                href={`/blogs/${post.slug}`}
                className="article-index-entry"
              >
                {post.coverImageUrl && (
                  <Image
                    src={post.coverImageUrl}
                    width={320}
                    height={180}
                    alt=""
                    unoptimized={post.coverImageUrl.includes("/uploads/")}
                    className="article-index-image"
                    sizes="180px"
                  />
                )}
                <div>
                  <p className="article-category">
                    {post.category?.name ?? "Article"}
                  </p>
                  <h2>{post.title}</h2>
                  <p>{post.excerpt}</p>
                  <ArticleMeta post={post} />
                </div>
                <ArrowUpRight size={20} />
              </Link>
            ))}
        </div>
        {posts.length === 0 && (
          <div className="empty-state">
            <Search size={24} />
            <h2>No articles found</h2>
            <p>
              {filteredRes
                ? "Try another category or search term."
                : "The journal is temporarily unavailable. Please try again shortly."}
            </p>
            <Link href="/blogs" className="text-link">
              Clear filters <ArrowRight size={16} />
            </Link>
          </div>
        )}
        {totalPages > 1 && (
          <nav className="journal-pagination" aria-label="Article pages">
            {page > 1 ? (
              <Link
                href={href(params.category, page - 1)}
                className="text-link"
              >
                <ArrowLeft size={16} /> Previous
              </Link>
            ) : (
              <span />
            )}
            <span>
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={href(params.category, page + 1)}
                className="text-link"
              >
                Next <ArrowRight size={16} />
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
