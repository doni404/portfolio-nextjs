import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, Clock, Search } from "lucide-react";
import { blogPosts, categories } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { BlogSearch } from "@/components/blog/BlogSearch";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Technical articles by Doni Putra Purbawa on backend engineering, cloud infrastructure, payment systems, AI, and machine learning.",
};

interface BlogsPageProps {
  searchParams: Promise<{ category?: string; q?: string }>;
}

export default async function Blogs({ searchParams }: BlogsPageProps) {
  const params = await searchParams;
  const selectedCategory = params.category;
  const searchQuery = params.q?.toLowerCase();

  const publishedPosts = blogPosts.filter((p) => p.status === "published");

  const filtered = publishedPosts.filter((post) => {
    const matchCategory = !selectedCategory || post.category === selectedCategory;
    const matchSearch =
      !searchQuery ||
      post.title.toLowerCase().includes(searchQuery) ||
      post.excerpt.toLowerCase().includes(searchQuery) ||
      post.tags.some((t) => t.toLowerCase().includes(searchQuery));
    return matchCategory && matchSearch;
  });

  const featured = publishedPosts.find((p) => p.featured);
  const showFeatured = !selectedCategory && !searchQuery;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Blog</h1>
          <p className="mt-2 max-w-xl text-slate-500">
            Technical writing on backend engineering, cloud infrastructure, payment systems, AI, and
            machine learning.
          </p>
          {/* Search */}
          <div className="mt-5">
            <BlogSearch defaultValue={params.q} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {/* Featured article */}
        {showFeatured && featured && (
          <div className="mb-10">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-blue-600">
              Featured Article
            </p>
            <Link
              href={`/blogs/${featured.slug}`}
              className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:border-blue-200 hover:shadow-lg"
            >
              <div className="flex flex-col gap-0 lg:flex-row">
                <div className="flex h-48 items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 p-8 lg:h-auto lg:w-64 lg:flex-shrink-0">
                  <span className="text-6xl font-black text-blue-200 opacity-40">
                    {featured.category.charAt(0)}
                  </span>
                </div>
                <div className="p-6 lg:p-8">
                  <Badge variant="blue" className="mb-3">
                    {featured.category}
                  </Badge>
                  <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-700 sm:text-2xl">
                    {featured.title}
                  </h2>
                  <p className="mt-2 leading-relaxed text-slate-500">{featured.excerpt}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(featured.publishedAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {featured.readingTime} min read
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Articles */}
          <div className="flex-1">
            {/* Category pills (mobile) */}
            <div className="mb-6 flex flex-wrap gap-2 lg:hidden">
              <Link
                href="/blogs"
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  !selectedCategory
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                All
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/blogs?category=${encodeURIComponent(cat)}`}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </Link>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
                <Search className="mb-3 h-8 w-8 text-slate-300" />
                <h3 className="font-medium text-slate-700">No articles found</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Try a different category or search term.
                </p>
                <Link href="/blogs" className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700">
                  Clear filters
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blogs/${post.slug}`}
                    className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-blue-200 hover:shadow-md sm:flex-row sm:items-start"
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 text-xl font-bold text-blue-400">
                      {post.category.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <Badge variant="blue">{post.category}</Badge>
                        {post.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="gray">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <h2 className="font-semibold text-slate-900 group-hover:text-blue-700 line-clamp-2">
                        {post.title}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500 line-clamp-2">{post.excerpt}</p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(post.publishedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {post.readingTime} min read
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar — categories (desktop) */}
          <aside className="hidden w-52 flex-shrink-0 lg:block">
            <div className="sticky top-24 rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Categories
              </h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/blogs"
                    className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                      !selectedCategory
                        ? "bg-blue-50 font-medium text-blue-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    All articles
                    <span className="ml-1 text-xs text-slate-400">({publishedPosts.length})</span>
                  </Link>
                </li>
                {categories.map((cat) => {
                  const count = publishedPosts.filter((p) => p.category === cat).length;
                  return (
                    <li key={cat}>
                      <Link
                        href={`/blogs?category=${encodeURIComponent(cat)}`}
                        className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                          selectedCategory === cat
                            ? "bg-blue-50 font-medium text-blue-700"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {cat}
                        {count > 0 && (
                          <span className="ml-1 text-xs text-slate-400">({count})</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
