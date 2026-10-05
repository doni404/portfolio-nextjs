import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { stageProductAsset } from "./import-product-projects.mjs";

const require = createRequire(import.meta.url);
const { articleWordCount, readingTimeMinutes } = require("../dist/lib/reading-time.js");
const { generatedImageType } = require("../dist/lib/generated-image.js");
const root = fileURLToPath(new URL("../content/japan-life-2026/", import.meta.url));
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const manifestSchema = z.object({
  version: z.literal("japan-life-2026-v1"),
  verifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  posts: z.array(z.object({
    slug, title: z.string().min(10).max(220), excerpt: z.string().min(40).max(320),
    file: z.string().regex(/^[a-z0-9-]+\.md$/), coverAsset: z.string().regex(/^[a-z0-9-]+\.png$/),
    format: z.enum(["explainer", "practical-guide"]),
    inlineAssets: z.array(z.object({ key: slug, file: z.string().regex(/^[a-z0-9-]+\.png$/) })).max(4).default([]),
    sources: z.array(z.object({ title: z.string().min(3), url: z.string().url().refine((url) => new URL(url).protocol === "https:") })).min(2).max(8),
  })).min(5).max(20),
}).strict();

export async function loadJapanLife(directory = root) {
  const manifest = manifestSchema.parse(JSON.parse(await readFile(path.join(directory, "manifest.json"), "utf8")));
  const checked = new Date(`${manifest.verifiedAt}T00:00:00Z`);
  if (!Number.isFinite(checked.getTime()) || checked.toISOString().slice(0, 10) !== manifest.verifiedAt || checked > new Date()) throw new Error("Invalid verification date");
  if (new Set(manifest.posts.map((post) => post.slug)).size !== manifest.posts.length) throw new Error("Duplicate Japan article slug");
  for (const post of manifest.posts) {
    post.content = (await readFile(path.join(directory, post.file), "utf8")).trim();
    if (post.content.length > 18000 || articleWordCount(post.content) < 450 || /<\/?(?:script|iframe|style|object)\b/i.test(post.content)) throw new Error(`Invalid article: ${post.slug}`);
    if (new Set(post.sources.map((source) => source.url)).size !== post.sources.length || post.sources.some((source) => !post.content.includes(source.url))) throw new Error(`Missing source citations: ${post.slug}`);
    post.sourceAsset = path.join(directory, "assets", post.coverAsset);
    const bytes = await readFile(post.sourceAsset);
    if (generatedImageType(bytes)?.extension !== "png") throw new Error(`Invalid cover: ${post.slug}`);
    post.assetName = `${post.slug}-${createHash("sha256").update(bytes).digest("hex").slice(0, 12)}.png`;
    if (new Set(post.inlineAssets.map((asset) => asset.key)).size !== post.inlineAssets.length) throw new Error(`Duplicate inline asset: ${post.slug}`);
    for (const asset of post.inlineAssets) {
      if (!post.content.includes(`(asset:${asset.key})`)) throw new Error(`Unreferenced inline asset: ${post.slug}`);
      asset.sourceAsset = path.join(directory, "assets", asset.file);
      const inlineBytes = await readFile(asset.sourceAsset);
      if (generatedImageType(inlineBytes)?.extension !== "png") throw new Error(`Invalid inline image: ${post.slug}`);
      asset.assetName = `${post.slug}-${asset.key}-${createHash("sha256").update(inlineBytes).digest("hex").slice(0, 12)}.png`;
      post.content = post.content.replaceAll(`(asset:${asset.key})`, `(/uploads/blogs/japan-life/${asset.assetName})`);
    }
    if (post.content.includes("(asset:")) throw new Error(`Unresolved inline image: ${post.slug}`);
    post.readingTime = readingTimeMinutes(post.content);
  }
  return manifest;
}

export async function importJapanLife({ apply = false, client = new PrismaClient(), directory = root } = {}) {
  try {
    const manifest = await loadJapanLife(directory);
    const existing = await client.blogPost.findMany({ where: { slug: { in: manifest.posts.map((post) => post.slug) } }, select: { id: true, slug: true } });
    const pending = manifest.posts.filter((post) => !existing.some((row) => row.slug === post.slug));
    console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", create: pending.map((post) => ({ slug: post.slug, readingTimeMinutes: post.readingTime })), preserve: existing.map((row) => row.slug), delete: [], paidApiCalls: 0 }, null, 2));
    if (!apply || !pending.length) return [];
    const now = new Date();
    const backupDir = path.resolve(process.env.EDITORIAL_BACKUP_DIR ?? "storage/backups", `japan-life-${now.toISOString().replaceAll(":", "-")}`);
    await mkdir(backupDir, { recursive: true });
    const backupPath = path.join(backupDir, "import.json");
    const backup = { version: manifest.version, createdAt: now.toISOString(), preserved: existing, plannedSlugs: pending.map((post) => post.slug), created: [] };
    await writeFile(backupPath, JSON.stringify(backup, null, 2), { flag: "wx", mode: 0o600 });
    const uploads = path.resolve(process.env.UPLOAD_DIR ?? "storage/uploads");
    for (const post of pending) {
      await stageProductAsset(post.sourceAsset, path.join(uploads, "blogs", "japan-life", post.assetName));
      for (const asset of post.inlineAssets) await stageProductAsset(asset.sourceAsset, path.join(uploads, "blogs", "japan-life", asset.assetName));
    }
    const created = await client.$transaction(async (tx) => {
      // Serialize imports of this package; never overwrite an existing slug, even if archived.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(2026, 105)`;
      const author = await tx.author.findUniqueOrThrow({ where: { slug: "doni-putra-purbawa" } });
      const category = await tx.category.upsert({ where: { slug: "japan-life" }, update: {}, create: { slug: "japan-life", name: "Japan Life", type: "blog" } });
      const tag = await tx.tag.upsert({ where: { slug: "japan-life" }, update: {}, create: { slug: "japan-life", name: "Japan Life" } });
      const result = [];
      for (const post of pending) {
        if (await tx.blogPost.findUnique({ where: { slug: post.slug }, select: { id: true } })) continue;
        const sources = post.sources.map((source) => `- [${source.title}](${source.url}) (checked ${manifest.verifiedAt})`).join("\n");
        result.push(await tx.blogPost.create({ data: {
          title: post.title, slug: post.slug, excerpt: post.excerpt, content: `${post.content}\n\n## Sources\n\n${sources}`,
          authorId: author.id, categoryId: category.id, status: "published", featured: false,
          coverImageUrl: `/uploads/blogs/japan-life/${post.assetName}`, readingTimeMinutes: post.readingTime,
          seoTitle: post.title, seoDescription: post.excerpt, publishedAt: now,
          storyDate: new Date(`${manifest.verifiedAt}T00:00:00Z`),
          editorialMeta: { seedVersion: manifest.version, beat: "japan", format: post.format, practicalGuide: true, verifiedAt: manifest.verifiedAt, aiAssisted: true, retrospective: false, wordCount: articleWordCount(post.content), sources: post.sources, coverProvenance: "Concept artwork created with Codex; not a photograph of the named service", disclosure: "A source-linked practical guide prepared with AI assistance. Examples and artwork are illustrative." },
          tags: { create: [{ tagId: tag.id }] },
        }, select: { id: true, slug: true, readingTimeMinutes: true } }));
      }
      return result;
    }, { timeout: 30000 });
    backup.created = created;
    await writeFile(backupPath, JSON.stringify(backup, null, 2), { mode: 0o600 });
    console.log(`Created ${created.length} Japan Life articles. Existing posts, featured selections, comments, projects, and accounts were not changed. Import record: ${backupPath}`);
    return created;
  } finally { await client.$disconnect(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (process.argv.slice(2).some((arg) => arg !== "--apply")) throw new Error("Usage: npm run content:japan-life [-- --apply]");
  await importJapanLife({ apply: process.argv.includes("--apply") });
}
