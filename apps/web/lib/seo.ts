import type { MetadataRoute } from "next";
import type { BlogPost, Paginated, Project } from "./server-api";
import {
  absoluteUrl, buildMetadata, ogImageUrl, siteConfig, socialImageUrl,
} from "./metadata";

export type BlogIndexParams = {
  category?: string | string[];
  q?: string | string[];
  page?: string | string[];
  year?: string | string[];
};

export function normalizeBlogParams(params: BlogIndexParams) {
  const first = (value?: string | string[]) =>
    (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
  const year = first(params.year);
  return {
    category: first(params.category),
    q: first(params.q),
    page: first(params.page),
    year: /^\d{4}$/.test(year ?? "") && Number(year) >= 2024 && Number(year) <= 2100 ? year : undefined,
  };
}

export function blogPage(value?: string) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function blogIndexMetadata(input: BlogIndexParams) {
  const params = normalizeBlogParams(input);
  const page = blogPage(params.page);
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.q) query.set("q", params.q);
  if (params.year) query.set("year", params.year);
  if (page > 1) query.set("page", String(page));
  return buildMetadata({
    title: `AI, Technology & Japan Life Journal${page > 1 ? ` - Page ${page}` : ""}`,
    description:
      "Explore AI and technology news, cloud and backend engineering, and practical Japan daily-life guides by Doni Putra Purbawa.",
    path: `/blogs${query.size ? `?${query}` : ""}`,
    imageTitle: "The Journal",
    noIndex: Boolean(params.q || params.category || params.year),
  });
}

export const personSchema = {
  "@type": "Person",
  "@id": absoluteUrl("/#person"),
  name: siteConfig.name,
  alternateName: siteConfig.shortName,
  url: absoluteUrl("/about"),
  image: absoluteUrl("/profile.png"),
  jobTitle: "Cloud Architect & Senior Backend Engineer",
  sameAs: ["https://github.com/doni404", "https://www.linkedin.com/in/doniputra/"],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@graph": [
    personSchema,
    {
      "@type": "WebSite",
      "@id": absoluteUrl("/#website"),
      name: siteConfig.name,
      alternateName: siteConfig.shortName,
      url: absoluteUrl("/"),
      description: siteConfig.description,
      inLanguage: "en",
      publisher: { "@id": personSchema["@id"] },
    },
  ],
};

export function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

function validDate(value?: string) {
  if (!value || Number.isNaN(Date.parse(value))) return undefined;
  return new Date(value).toISOString();
}

export function articleSchema(post: BlogPost) {
  const url = absoluteUrl(`/blogs/${post.slug}`);
  const authorName = post.author?.name ?? siteConfig.name;
  const author =
    authorName === siteConfig.name || authorName === siteConfig.shortName
      ? personSchema
      : { "@type": "Person", name: authorName };
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    url,
    headline: post.title,
    description: post.excerpt,
    image: [socialImageUrl(post.coverImageUrl) ?? ogImageUrl({
      title: post.title,
      description: post.excerpt,
      label: "The Journal",
    })],
    datePublished: validDate(post.publishedAt),
    dateModified: validDate(post.updatedAt),
    author,
    publisher: personSchema,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    isPartOf: { "@id": absoluteUrl("/#website") },
    inLanguage: "en",
    articleSection: post.category?.name,
    keywords: post.tags.map((tag) => tag.name),
  };
}

export function projectSchema(project: Project) {
  const url = absoluteUrl(`/projects/${project.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${url}#case-study`,
    name: project.title,
    description: project.summary,
    url,
    image: socialImageUrl(project.coverImageUrl),
    author: personSchema,
    dateModified: validDate(project.updatedAt),
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    isPartOf: { "@id": absoluteUrl("/#website") },
    inLanguage: "en",
    genre: "Technical case study",
    keywords: project.stack,
  };
}

export function serializeJsonLd(data: object | object[]) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export async function allSitemapItems<T>(
  fetchPage: (params: Record<string, string>) => Promise<Paginated<T> | null>,
) {
  const items: T[] = [];
  let totalPages = 1;
  for (let page = 1; page <= totalPages; page++) {
    const response = await fetchPage({ page: String(page), pageSize: "100" });
    if (
      !response ||
      response.pagination.page !== page ||
      !Number.isSafeInteger(response.pagination.totalPages) ||
      response.pagination.totalPages < 0
    )
      throw new Error("Cannot generate a complete sitemap: content API unavailable.");
    totalPages = response.pagination.totalPages;
    items.push(...response.data);
  }
  return items;
}

export function contentSitemap(
  posts: BlogPost[],
  projects: Project[],
): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    "/", "/about", "/experience", "/projects", "/blogs", "/contact",
  ].map((path) => ({ url: absoluteUrl(path) }));
  const collections = [["blogs", posts], ["projects", projects]] as const;
  for (const [type, items] of collections) {
    for (const item of items) {
      if (item.status !== "published") continue;
      const image = socialImageUrl(item.coverImageUrl);
      entries.push({
        url: absoluteUrl(`/${type}/${item.slug}`),
        lastModified: validDate(item.updatedAt),
        ...(image ? { images: [image] } : {}),
      });
    }
  }
  const unique = [...new Map(entries.map((entry) => [entry.url, entry])).values()];
  if (unique.length > 50000)
    throw new Error("Split the sitemap before publishing more than 50,000 URLs.");
  return unique;
}
