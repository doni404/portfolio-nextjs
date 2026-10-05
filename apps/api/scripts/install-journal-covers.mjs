import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadArchive } from "./import-journal-archive.mjs";
import { stageProductAsset } from "./import-product-projects.mjs";

export function canInstallCover(current, post, versions, previousUrl) {
  return Boolean(current && !current.deletedAt && versions.includes(current.editorialMeta?.seedVersion)
    && current.title === post.title && current.content === post.content
    && [previousUrl, `/uploads/blogs/archive/${post.assetName}`, ...(post.previousCoverAssets ?? []).map((asset) => `/uploads/blogs/archive/${asset}`)].includes(current.coverImageUrl));
}

export async function installCovers({ apply = false, client = new PrismaClient({ log: ["error"] }) } = {}) {
  try {
    const archive = await loadArchive();
    const posts = archive.posts.filter((post) => post.coverAsset);
    const rows = await client.blogPost.findMany({ where: { slug: { in: posts.map((post) => post.slug) } } });
    const eligible = []; const skipped = [];
    for (const post of posts) {
      const old = await readFile(new URL(`../content/editorial-2026/assets/${post.asset}.webp`, import.meta.url));
      const previousUrl = `/uploads/blogs/archive/${post.asset}-${createHash("sha256").update(old).digest("hex").slice(0, 12)}.webp`;
      const current = rows.find((row) => row.slug === post.slug);
      if (canInstallCover(current, post, [archive.version, archive.retireSeedVersion], previousUrl)) eligible.push({ post, current });
      else skipped.push(post.slug);
    }
    const changed = eligible.filter(({ post, current }) => current.coverImageUrl !== `/uploads/blogs/archive/${post.assetName}`);
    console.log(JSON.stringify({ mode: apply ? "install" : "dry-run", copyAssets: eligible.map(({ post }) => post.slug), updateCovers: changed.map(({ post }) => post.slug), preservedEditsOrMissingPosts: skipped, paidApiCalls: 0 }, null, 2));
    if (!apply || !eligible.length) return;
    const uploads = path.resolve(process.env.UPLOAD_DIR ?? "storage/uploads");
    if (changed.length) {
      const backupDir = path.resolve(process.env.EDITORIAL_BACKUP_DIR ?? "storage/backups", `journal-cover-install-${Date.now()}`);
      await mkdir(backupDir, { recursive: true });
      await writeFile(path.join(backupDir, "backup.json"), JSON.stringify(changed.map(({ current }) => ({ id: current.id, slug: current.slug, coverImageUrl: current.coverImageUrl, editorialMeta: current.editorialMeta, updatedAt: current.updatedAt })), null, 2), { flag: "wx", mode: 0o600 });
      console.log(`Cover backup: ${backupDir}`);
    }
    for (const { post } of eligible) await stageProductAsset(post.sourceAsset, path.join(uploads, "blogs", "archive", post.assetName));
    await client.$transaction(async (tx) => {
      for (const { post, current } of changed) {
        const result = await tx.blogPost.updateMany({ where: { id: current.id, updatedAt: current.updatedAt, deletedAt: null }, data: {
          coverImageUrl: `/uploads/blogs/archive/${post.assetName}`,
          editorialMeta: { ...current.editorialMeta, coverProvenance: "AI-generated editorial illustration; not a product screenshot", coverGeneration: { ...post.coverGeneration, importedAt: new Date().toISOString() } },
        } });
        if (result.count !== 1) throw new Error("An article changed during installation; no database covers were overwritten");
      }
    }, { timeout: 30000 });
  } finally { await client.$disconnect(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await installCovers({ apply: process.argv.includes("--apply") });
