import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { stageProductAsset } from "./import-product-projects.mjs";

const root = fileURLToPath(new URL("../content/journal-archive/", import.meta.url));
const assetRoot = fileURLToPath(new URL("../content/editorial-2026/assets/", import.meta.url));
export async function loadArchive(directory = root) {
  const manifest = JSON.parse(await readFile(path.join(directory, "manifest.json"), "utf8"));
  const counts = { 2024: 0, 2025: 0, 2026: 0 }; const seen = new Set();
  for (const post of manifest.posts) {
    if (!/^[a-z0-9-]+$/.test(post.slug) || seen.has(post.slug) || !/^[a-z0-9-]+\.md$/.test(post.file) || !/^[a-z0-9-]+$/.test(post.asset) || !/^202[456]-\d{2}-\d{2}$/.test(post.date) || new URL(post.source).protocol !== "https:" || !["industry", "policy", "work", "products", "research", "engineering", "models"].includes(post.beat)) throw new Error("Invalid archive manifest");
    seen.add(post.slug); counts[post.date.slice(0, 4)]++;
    post.content = await readFile(path.join(directory, post.file), "utf8");
    if (post.content.length < 1200 || !post.content.includes(post.source)) throw new Error(`Missing sourced content: ${post.slug}`);
    if (post.coverAsset && !/^[a-z0-9-]+\.(?:webp|png)$/.test(post.coverAsset)) throw new Error("Invalid generated cover path");
    if (post.previousCoverAssets && (!Array.isArray(post.previousCoverAssets) || post.previousCoverAssets.some((asset) => typeof asset !== "string" || !/^[a-z0-9-]+\.(?:webp|png)$/.test(asset)))) throw new Error("Invalid previous cover paths");
    post.sourceAsset = post.coverAsset ? path.join(directory, "assets", post.coverAsset) : path.join(assetRoot, `${post.asset}.webp`);
    const bytes = await readFile(post.sourceAsset);
    const webp = bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP";
    const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    if (!webp && !png) throw new Error("Invalid cover asset");
    post.assetName = post.coverAsset ?? `${post.asset}-${createHash("sha256").update(bytes).digest("hex").slice(0, 12)}.webp`;
  }
  for (const post of manifest.retirePosts ?? []) {
    if (!/^[a-z0-9-]+$/.test(post.slug) || seen.has(post.slug) || !/^[a-z0-9-]+\.md$/.test(post.file)) throw new Error("Invalid retirement manifest");
    seen.add(post.slug);
    post.content = await readFile(path.join(directory, post.file), "utf8");
  }
  if (JSON.stringify(counts) !== JSON.stringify({ 2024: 5, 2025: 5, 2026: 3 })) throw new Error("Archive must contain 5 / 5 / 3 posts");
  return manifest;
}
const snapshot = (post) => ({ id: post.id, slug: post.slug, title: post.title, status: post.status, deletedAt: post.deletedAt, updatedAt: post.updatedAt });
export function canRetireSeed(post, original, seedVersion) {
  return Boolean(!post.deletedAt && post.status === "published" && post.editorialMeta?.seedVersion === seedVersion && post.title === original.title && post.content === original.content && new Date(post.createdAt).getTime() === new Date(post.updatedAt).getTime());
}
export async function importArchive({ apply = false, client = new PrismaClient() } = {}) {
  try {
    const manifest = await loadArchive();
    const candidates = await client.blogPost.findMany({ where: { slug: { in: (manifest.retirePosts ?? []).map((post) => post.slug) }, deletedAt: null } });
    const retire = candidates.filter((post) => canRetireSeed(post, manifest.retirePosts.find((original) => original.slug === post.slug), manifest.retireSeedVersion));
    const old = [...await client.blogPost.findMany({ where: { slug: { in: manifest.replaceSlugs }, deletedAt: null } }), ...retire];
    const existing = await client.blogPost.findMany({ where: { slug: { in: manifest.posts.map((post) => post.slug) } }, select: { slug: true } });
    const toInsert = manifest.posts.filter((post) => !existing.some((row) => row.slug === post.slug));
    console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", softDelete: old.map((post) => post.slug), preservedEditedPosts: candidates.filter((post) => !retire.includes(post)).map((post) => post.slug), insert: toInsert.map((post) => post.slug), preservedComments: true, years: { 2024: 5, 2025: 5, 2026: 3 } }, null, 2));
    if (!apply || (!old.length && !toInsert.length)) return;
    const now = new Date();
    const backupDir = path.resolve(process.env.EDITORIAL_BACKUP_DIR ?? "storage/backups", `journal-${now.toISOString().replaceAll(":", "-")}`);
    await mkdir(backupDir, { recursive: true });
    const backup = { version: manifest.version, createdAt: now.toISOString(), old, insertedSlugs: toInsert.map((post) => post.slug), after: [] };
    const backupPath = path.join(backupDir, "backup.json");
    await writeFile(backupPath, JSON.stringify(backup, null, 2), { flag: "wx", mode: 0o600 });
    const uploads = path.resolve(process.env.UPLOAD_DIR ?? "storage/uploads");
    for (const post of toInsert) await stageProductAsset(post.sourceAsset, path.join(uploads, "blogs", "archive", post.assetName));
    const after = await client.$transaction(async (tx) => {
      // Lock all existing rows before comparing the preflight snapshot.
      for (const post of old) {
        await tx.$queryRaw`SELECT id FROM blog_posts WHERE id = ${post.id}::uuid FOR UPDATE`;
        const current = await tx.blogPost.findUniqueOrThrow({ where: { id: post.id } });
        if (JSON.stringify(snapshot(current)) !== JSON.stringify(snapshot(post))) throw new Error("Journal changed during preflight; run the import again");
      }
      const author = await tx.author.findUniqueOrThrow({ where: { slug: "doni-putra-purbawa" } });
      const category = await tx.category.upsert({ where: { slug: "ai-news" }, update: {}, create: { slug: "ai-news", name: "AI & Technology", type: "blog" } });
      const changed = [];
      for (const post of old) changed.push(snapshot(await tx.blogPost.update({ where: { id: post.id }, data: { status: "archived", deletedAt: now } })));
      for (const post of toInsert) {
        const flow = ["gemini-25", "claude-4", "gpt-5", "gpt-54"].includes(post.file.replace(".md", "")) ? [{ title: "Define the task", description: "Specify the inputs, permissions, and expected result." }, { title: "Select the approach", description: "Use the model or deterministic tool the task actually needs." }, { title: "Verify the result", description: "Check evidence and get approval before consequential actions." }] : [];
        changed.push(snapshot(await tx.blogPost.create({ data: { authorId: author.id, categoryId: category.id, title: post.title, slug: post.slug, excerpt: post.excerpt, content: post.content, status: "published", featured: post.featured === true, coverImageUrl: `/uploads/blogs/archive/${post.assetName}`, readingTimeMinutes: Math.max(2, Math.ceil(post.content.split(/\s+/).length / 220)), seoTitle: post.title, seoDescription: post.excerpt, publishedAt: now, storyDate: new Date(`${post.date}T00:00:00Z`), editorialMeta: { seedVersion: manifest.version, retrospective: true, aiAssisted: true, beat: post.beat, format: post.format, source: post.source, flow, coverProvenance: "AI-generated editorial illustration; not a product screenshot", disclosure: "AI-assisted retrospective with sourced facts and original editorial interpretation. Not contemporary reporting or firsthand product testing." } } })));
      }
      return changed;
    }, { timeout: 30000 });
    backup.after = after;
    await writeFile(backupPath, JSON.stringify(backup, null, 2), { mode: 0o600 });
    console.log(`Backup: ${backupPath}`);
  } finally { await client.$disconnect(); }
}
async function restoreArchive(file, apply) {
  const backup = JSON.parse(await readFile(path.resolve(file), "utf8"));
  if (!backup.after?.length || !Array.isArray(backup.old)) throw new Error("Incomplete archive backup");
  const client = new PrismaClient();
  try {
    await client.$transaction(async (tx) => {
      for (const expected of backup.after) {
        await tx.$queryRaw`SELECT id FROM blog_posts WHERE id = ${expected.id}::uuid FOR UPDATE`;
        const current = await tx.blogPost.findUniqueOrThrow({ where: { id: expected.id } });
        if (JSON.stringify(snapshot(current)) !== JSON.stringify(expected)) throw new Error("Refusing to overwrite a post edited since the import");
      }
      if (!apply) return;
      for (const post of backup.old) await tx.blogPost.update({ where: { id: post.id }, data: { status: post.status, deletedAt: post.deletedAt ? new Date(post.deletedAt) : null } });
      await tx.blogPost.updateMany({ where: { slug: { in: backup.insertedSlugs } }, data: { status: "archived", deletedAt: new Date() } });
    }, { timeout: 30000 });
    console.log(apply ? "Restored old publication states; imported posts soft-deleted." : "Restore preflight passed. Add --apply to restore.");
  } finally { await client.$disconnect(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const restore = process.argv.indexOf("--restore");
  if (restore >= 0) await restoreArchive(process.argv[restore + 1], process.argv.includes("--apply"));
  else await importArchive({ apply: process.argv.includes("--apply") });
}
