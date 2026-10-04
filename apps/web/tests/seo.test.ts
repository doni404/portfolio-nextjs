import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMetadata, siteConfig, siteOrigin } from "../lib/metadata";
import { mediaUrl } from "../lib/media";
import {
  allSitemapItems, articleSchema, blogIndexMetadata, blogPage,
  breadcrumbs, contentSitemap, projectSchema, serializeJsonLd,
} from "../lib/seo";
import robots from "../app/robots";
import type { BlogPost, Project } from "../lib/server-api";

const post: BlogPost = {
  id: "post", slug: "practical-cloud", title: "Practical Cloud Architecture",
  excerpt: "Practical cloud engineering lessons.", content: "## A lesson",
  status: "published", featured: false, readingTimeMinutes: 5,
  publishedAt: "2026-01-01T12:00:00Z", updatedAt: "2026-10-04T02:00:00Z",
  createdAt: "2026-01-01T12:00:00Z", tags: [],
};
const project: Project = {
  id: "project", slug: "voice-editor", title: "Voice Editor", summary: "Voice-powered text editing.",
  status: "published", featured: true, year: 2026, sortOrder: 0, stack: ["Node.js", "Electron"],
  tags: [], links: [], createdAt: "2026-04-01T00:00:00Z", updatedAt: "2026-10-03T12:00:00Z",
};

test("canonical origin is normalized without paths, queries or credentials", () => {
  assert.equal(siteOrigin(" https://doniputra.com/blogs?q=ai#top "), "https://doniputra.com");
  assert.equal(siteOrigin(""), "https://doniputra.com");
  assert.throws(() => siteOrigin("javascript:alert(1)"));
  assert.throws(() => siteOrigin("https://user:secret@doniputra.com"));
});

test("metadata uses one brand suffix, a clean canonical and large social previews", () => {
  const meta = buildMetadata({ title: "AI Engineering", path: "/blogs/ai#top", type: "article" });
  assert.deepEqual(meta.title, { absolute: "AI Engineering | Doni Putra" });
  assert.equal(meta.alternates?.canonical, `${siteConfig.url}/blogs/ai`);
  assert.ok(meta.twitter && "card" in meta.twitter);
  assert.equal(meta.twitter.card, "summary_large_image");
  assert.equal(meta.openGraph?.url, meta.alternates?.canonical);
  assert.ok(meta.robots && typeof meta.robots === "object");
  assert.ok(meta.robots.googleBot && typeof meta.robots.googleBot === "object");
  assert.equal(meta.robots.googleBot["max-image-preview"], "large");
  assert.ok(meta.alternates?.types?.["application/rss+xml"]);
  const generated = meta.openGraph?.images as { url: string; width?: number; height?: number }[];
  assert.equal(generated[0].width, 1200);
  assert.equal(generated[0].height, 630);
  const uploaded = buildMetadata({ image: "https://api.example.com/uploads/cover.webp" }).openGraph?.images as typeof generated;
  assert.equal(uploaded[0].width, undefined);
  assert.equal(uploaded[0].height, undefined);
  assert.match((buildMetadata({ image: "javascript:alert(1)" }).openGraph?.images as typeof generated)[0].url, /\/api\/og\?/);
  assert.deepEqual(buildMetadata().title, { absolute: siteConfig.title });
});

test("pagination is self-canonical; search and category views are noindex, follow", () => {
  assert.equal(blogIndexMetadata({ page: "2" }).alternates?.canonical, `${siteConfig.url}/blogs?page=2`);
  assert.equal(blogIndexMetadata({ page: "1", q: " " }).alternates?.canonical, `${siteConfig.url}/blogs`);
  const filtered = blogIndexMetadata({ q: ["cloud", "ai"], category: "Cloud & DevOps", page: "2" });
  assert.ok(filtered.robots && typeof filtered.robots === "object");
  assert.equal(filtered.robots.index, false);
  assert.equal(filtered.robots.follow, true);
  assert.match(String(filtered.alternates?.canonical), /q=cloud/);
  for (const page of ["-1", "Infinity", "1.5", "abc", "9007199254740992"])
    assert.equal(blogPage(page), 1);
});

test("API-local upload URLs resolve publicly without rewriting unrelated CDN assets", () => {
  const previousPublic = process.env.NEXT_PUBLIC_API_URL;
  const previousInternal = process.env.API_URL;
  process.env.NEXT_PUBLIC_API_URL = "https://api.example.com/";
  process.env.API_URL = "http://api-container:4000";
  try {
    assert.equal(mediaUrl("http://api-container:4000/uploads/projects/cover.webp?v=2"), "https://api.example.com/uploads/projects/cover.webp?v=2");
    assert.equal(mediaUrl("http://localhost:4000/uploads/projects/cover.webp"), "https://api.example.com/uploads/projects/cover.webp");
    assert.equal(mediaUrl("https://cdn.example.com/uploads/cover.webp"), "https://cdn.example.com/uploads/cover.webp");
  } finally {
    if (previousPublic === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = previousPublic;
    if (previousInternal === undefined) delete process.env.API_URL;
    else process.env.API_URL = previousInternal;
  }
});

test("structured data uses real article dates, author identity and safe JSON", () => {
  const schema = articleSchema(post);
  assert.equal(schema["@type"], "BlogPosting");
  assert.equal(schema.datePublished, "2026-01-01T12:00:00.000Z");
  assert.equal(schema.dateModified, "2026-10-04T02:00:00.000Z");
  assert.equal(schema.author.name, siteConfig.name);
  assert.equal(articleSchema({ ...post, publishedAt: "invalid" }).datePublished, undefined);
  const otherAuthor = articleSchema({ ...post, author: { id: "other", name: "Another Author", slug: "another" } }).author;
  assert.equal("url" in otherAuthor, false);
  assert.equal(projectSchema(project)["@type"], "CreativeWork");
  assert.equal("aggregateRating" in projectSchema(project), false);
  assert.equal("datePublished" in projectSchema(project), false);
  const dangerous = { headline: '</script><script>alert("x")</script>' };
  const serialized = serializeJsonLd(dangerous);
  assert.doesNotMatch(serialized, /<\/script>/);
  assert.deepEqual(JSON.parse(serialized), dangerous);
  const trail = breadcrumbs([{ name: "Home", path: "/" }, { name: project.title, path: `/projects/${project.slug}` }]);
  assert.equal(trail.itemListElement[1].position, 2);
  assert.equal(trail.itemListElement[1].item, `${siteConfig.url}/projects/voice-editor`);
});

test("sitemap loads every API page and refuses incomplete data", async () => {
  const calls: string[] = [];
  const entries = await allSitemapItems(async ({ page, pageSize }) => {
    calls.push(page);
    assert.equal(pageSize, "100");
    return { data: [{ slug: `post-${page}` }], pagination: { page: Number(page), pageSize: 100, total: 201, totalPages: 3 } };
  });
  assert.deepEqual(calls, ["1", "2", "3"]);
  assert.equal(entries.length, 3);
  await assert.rejects(allSitemapItems(async () => null), /complete sitemap/);
  await assert.rejects(allSitemapItems(async () => ({ data: [], pagination: { page: 2, pageSize: 100, total: 0, totalPages: 0 } })), /complete sitemap/);
  assert.deepEqual(await allSitemapItems(async () => ({ data: [], pagination: { page: 1, pageSize: 100, total: 0, totalPages: 0 } })), []);
});

test("sitemap includes only canonical published pages and real modification dates", () => {
  const entries = contentSitemap([post, post, { ...post, slug: "draft", status: "draft" }], [project, { ...project, slug: "archived", status: "archived" }]);
  assert.equal(entries.length, 8);
  assert.equal(entries.find((item) => item.url.endsWith("/blogs/practical-cloud"))?.lastModified, "2026-10-04T02:00:00.000Z");
  assert.equal(entries[0].lastModified, undefined);
  assert.ok(entries.every((item) => !/admin|draft|archived|\?|#/.test(item.url)));
  assert.equal(robots().sitemap, `${siteConfig.url}/sitemap.xml`);
  assert.ok((robots().rules as { allow: string[] }).allow.includes("/api/og"));
});
