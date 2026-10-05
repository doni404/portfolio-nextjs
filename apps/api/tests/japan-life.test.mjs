import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";
import { mkdtemp, readFile, stat, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { loadJapanLife, importJapanLife } from "../scripts/import-japan-life.mjs";

const require = createRequire(import.meta.url);
const { articleWordCount, readingTimeMinutes } = require("../dist/lib/reading-time.js");

test("reading time counts visible Markdown, not URLs, image alt text, or source lists", () => {
  assert.equal(articleWordCount("## Hello\n\nRead **this** [guide](https://example.com/a/very/long/url).\n\n![Not body text](image.png)\n\n## Sources\n\nIgnored reference words."), 4);
  assert.equal(readingTimeMinutes("word ".repeat(1541)), 8);
  assert.equal(readingTimeMinutes("word ".repeat(660)), 3);
  assert.equal(readingTimeMinutes(""), 1);
});

test("ten sourced Japan guides have varied depth, valid covers, and resolved inline visuals", async () => {
  const manifest = await loadJapanLife();
  assert.equal(manifest.posts.length, 10);
  assert.deepEqual(manifest.posts.map((post) => post.readingTime).sort(), [3, 4, 4, 5, 5, 6, 6, 7, 7, 8]);
  assert.ok(manifest.posts.every((post) => post.sources.every((source) => post.content.includes(source.url))));
  assert.ok(manifest.posts.every((post) => post.assetName.endsWith(".png") && !post.content.includes("(asset:")));
  assert.equal(manifest.posts.filter((post) => post.inlineAssets.length === 2).length, 2);
  for (const post of manifest.posts) for (const asset of post.inlineAssets) {
    assert.ok(post.content.includes(`/uploads/blogs/japan-life/${asset.assetName}`));
  }
});

test("additive Japan import preserves existing edits and is idempotent", async () => {
  const manifest = await loadJapanLife();
  const existing = { id: "original", slug: manifest.posts[0].slug, title: "My edited title", featured: true, status: "archived" };
  const rows = new Map([[existing.slug, existing]]);
  const created = [];
  const dir = await mkdtemp(path.join(tmpdir(), "japan-life-import-"));
  const oldUploads = process.env.UPLOAD_DIR;
  const oldBackups = process.env.EDITORIAL_BACKUP_DIR;
  let transactions = 0;
  const client = {
    blogPost: {
      findMany: async () => [...rows.values()],
      findUnique: async ({ where }) => rows.get(where.slug) ?? null,
      create: async ({ data }) => { const row = { id: `new-${created.length}`, ...data }; created.push(row); rows.set(row.slug, row); return { id: row.id, slug: row.slug, readingTimeMinutes: row.readingTimeMinutes }; },
    },
    author: { findUniqueOrThrow: async () => ({ id: "author" }) },
    category: { upsert: async ({ where }) => { assert.equal(where.slug, "japan-life"); return { id: "category" }; } },
    tag: { upsert: async () => ({ id: "tag" }) },
    $executeRaw: async () => 1,
    $transaction: async (run) => { transactions++; return run(client); },
    $disconnect: async () => {},
  };
  try {
    process.env.UPLOAD_DIR = path.join(dir, "uploads");
    process.env.EDITORIAL_BACKUP_DIR = path.join(dir, "backups");
    assert.equal((await importJapanLife({ client })).length, 0);
    assert.equal(transactions, 0);
    await importJapanLife({ apply: true, client });
    assert.equal(created.length, 9);
    assert.deepEqual(rows.get(existing.slug), existing);
    assert.ok(created.every((post) => post.status === "published" && !post.featured && post.editorialMeta.beat === "japan"));
    for (const post of created) {
      assert.equal(post.readingTimeMinutes, readingTimeMinutes(post.content));
      const file = path.join(process.env.UPLOAD_DIR, post.coverImageUrl.replace("/uploads/", ""));
      assert.ok((await stat(file)).size > 10000);
      assert.equal((await readFile(file)).subarray(1, 4).toString(), "PNG");
      const sourcePost = manifest.posts.find((source) => source.slug === post.slug);
      for (const asset of sourcePost.inlineAssets) {
        const inlineFile = path.join(process.env.UPLOAD_DIR, "blogs", "japan-life", asset.assetName);
        assert.ok((await stat(inlineFile)).size > 10000);
        assert.equal((await readFile(inlineFile)).subarray(1, 4).toString(), "PNG");
        assert.ok(post.content.includes(asset.assetName));
      }
    }
    assert.deepEqual(await importJapanLife({ apply: true, client }), []);
    assert.equal(created.length, 9);
    assert.equal(transactions, 1);
  } finally {
    if (oldUploads === undefined) delete process.env.UPLOAD_DIR; else process.env.UPLOAD_DIR = oldUploads;
    if (oldBackups === undefined) delete process.env.EDITORIAL_BACKUP_DIR; else process.env.EDITORIAL_BACKUP_DIR = oldBackups;
    await rm(dir, { recursive: true, force: true });
  }
});
