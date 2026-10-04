import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const apiRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const contentRoot = path.join(apiRoot, "content/editorial-2026");
const uploadRoot = path.resolve(
  apiRoot,
  process.env.UPLOAD_DIR || "storage/uploads",
);
const prisma = new PrismaClient();
const args = process.argv.slice(2);
const blogFields = [
  "title",
  "excerpt",
  "content",
  "coverImageUrl",
  "readingTimeMinutes",
  "seoTitle",
  "seoDescription",
];
const projectFields = [
  "title",
  "summary",
  "problem",
  "solution",
  "role",
  "outcome",
  "coverImageUrl",
  "links",
];

function pick(row, fields) {
  return Object.fromEntries(fields.map((field) => [field, row[field]]));
}
function matches(row, data) {
  return Object.entries(data).every(
    ([key, value]) => JSON.stringify(row[key]) === JSON.stringify(value),
  );
}
function portableImage(url) {
  if (!url) return null;
  if (url.startsWith("/uploads/")) return url;
  try {
    const parsed = new URL(url);
    return parsed.pathname.startsWith("/uploads/")
      ? parsed.pathname + parsed.search
      : url;
  } catch {
    return url;
  }
}
async function stageAsset(source, destination) {
  await mkdir(path.dirname(destination), { recursive: true });
  try {
    await copyFile(source, destination, constants.COPYFILE_EXCL);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
    if (hash(await readFile(source)) !== hash(await readFile(destination))) {
      throw new Error(
        `Refusing to overwrite a different asset: ${destination}`,
      );
    }
  }
}
async function lockedRecord(tx, model, id) {
  if (model === "blogPost") {
    await tx.$queryRaw`SELECT id FROM blog_posts WHERE id = ${id}::uuid FOR UPDATE`;
  } else {
    await tx.$queryRaw`SELECT id FROM projects WHERE id = ${id}::uuid FOR UPDATE`;
  }
  return tx[model].findUnique({ where: { id } });
}
async function restore(filename) {
  const backup = JSON.parse(await readFile(path.resolve(filename), "utf8"));
  if (backup.version !== "editorial-2026" || !Array.isArray(backup.records))
    throw new Error("Invalid backup");
  await prisma.$transaction(async (tx) => {
    for (const record of backup.records) {
      if (!["blogPost", "project"].includes(record.model))
        throw new Error("Invalid backup model");
      const current = await lockedRecord(tx, record.model, record.id);
      if (!current || current.deletedAt || !matches(current, record.after)) {
        throw new Error(
          `Record changed after refresh; refusing to overwrite: ${record.slug}`,
        );
      }
      const allowed = record.model === "blogPost" ? blogFields : projectFields;
      await tx[record.model].update({
        where: { id: record.id },
        data: pick(record.before, allowed),
      });
    }
  });
  console.log(
    `Restored ${backup.records.length} records. Uploaded files were left intact.`,
  );
}
async function refresh() {
  const manifest = JSON.parse(
    await readFile(path.join(contentRoot, "manifest.json"), "utf8"),
  );
  const records = [];
  const assets = [];
  async function includeAsset(kind, slug, asset) {
    const relative = `${kind}/${slug}/editorial-2026-${asset}.webp`;
    const source = path.join(contentRoot, "assets", `${asset}.webp`);
    await readFile(source);
    assets.push({ source, destination: path.join(uploadRoot, relative) });
    return `/uploads/${relative}`;
  }
  for (const kind of ["blogs", "projects"]) {
    const model = kind === "blogs" ? "blogPost" : "project";
    for (const entry of manifest[kind]) {
      const current = await prisma[model].findUnique({
        where: { slug: entry.slug },
      });
      if (!current || current.deletedAt)
        throw new Error(`Existing record not found: ${entry.slug}`);
      const imageUrl = await includeAsset(kind, entry.slug, entry.asset);
      let data;
      if (kind === "blogs") {
        const content = (
          await readFile(path.join(contentRoot, entry.contentFile), "utf8")
        ).trim();
        data = {
          title: entry.title,
          excerpt: entry.excerpt,
          content,
          readingTimeMinutes: Math.max(
            2,
            Math.ceil(content.split(/\s+/).length / 200),
          ),
          seoTitle: entry.title,
          seoDescription: entry.excerpt,
          coverImageUrl: imageUrl,
        };
      } else {
        const links = Array.isArray(current.links) ? [...current.links] : [];
        const originalImage = portableImage(current.coverImageUrl);
        const originalLabel = entry.originalImageLabel ?? "Technical workflow";
        if (
          originalImage &&
          !originalImage.includes("/editorial-2026-") &&
          !links.some((link) => link.label === originalLabel)
        ) {
          links.push({ label: originalLabel, url: originalImage });
        }
        for (const reference of entry.referenceAssets ?? []) {
          const url = await includeAsset(kind, entry.slug, reference.asset);
          if (!links.some((link) => link.url === url)) {
            links.push({ label: reference.label, url });
          }
        }
        data = {
          ...pick(entry, ["title", "summary", "problem", "role", "outcome"]),
          solution: (
            await readFile(path.join(contentRoot, entry.solutionFile), "utf8")
          ).trim(),
          coverImageUrl: imageUrl,
          links,
        };
      }
      if (matches(current, data)) {
        console.log(`Unchanged: ${entry.slug}`);
      } else {
        console.log(`Update ${kind}: ${entry.slug}`);
        records.push({
          model,
          id: current.id,
          slug: current.slug,
          updatedAt: current.updatedAt,
          before: pick(
            current,
            model === "blogPost" ? blogFields : projectFields,
          ),
          after: data,
        });
      }
    }
  }
  if (!args.includes("--apply")) {
    console.log(
      `Dry run: ${records.length} records would change. Run with --apply to back up and update.`,
    );
    return;
  }
  let backupPath;
  if (records.length) {
    const backupRoot = path.join(apiRoot, "storage/backups");
    await mkdir(backupRoot, { recursive: true });
    backupPath = path.join(
      backupRoot,
      `editorial-2026-${Date.now()}-${randomUUID()}.json`,
    );
    await writeFile(
      backupPath,
      JSON.stringify(
        {
          version: manifest.version,
          createdAt: new Date().toISOString(),
          records,
        },
        null,
        2,
      ),
      { flag: "wx", mode: 0o600 },
    );
    console.log(`Backup: ${backupPath}`);
  }
  for (const asset of assets) await stageAsset(asset.source, asset.destination);
  await prisma.$transaction(async (tx) => {
    for (const record of records) {
      // Row locks avoid precision loss when comparing PostgreSQL timestamps in JS.
      const current = await lockedRecord(tx, record.model, record.id);
      if (
        !current ||
        current.deletedAt ||
        current.updatedAt.getTime() !== record.updatedAt.getTime() ||
        !matches(current, record.before)
      ) {
        throw new Error(
          `Concurrent edit; entire update rolled back: ${record.slug}`,
        );
      }
      await tx[record.model].update({
        where: { id: record.id },
        data: record.after,
      });
    }
  });
  console.log(
    `Updated ${records.length} records. IDs, slugs, publication dates, categories, tags, and comments preserved.`,
  );
}

try {
  const target = new URL(process.env.DATABASE_URL);
  console.log(
    `Database: ${target.hostname}:${target.port || "5432"}${target.pathname}`,
  );
  console.log(`Upload directory: ${uploadRoot}`);
  if (args[0] === "--restore" && args.length === 2) await restore(args[1]);
  else if (args.length === 0 || (args.length === 1 && args[0] === "--apply"))
    await refresh();
  else
    throw new Error(
      "Usage: npm run content:refresh [-- --apply | -- --restore BACKUP.json]",
    );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
