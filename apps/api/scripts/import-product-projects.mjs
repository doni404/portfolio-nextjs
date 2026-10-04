import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = path.join(apiRoot, "content/product-projects-2026");
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const manifestSchema = z.object({
  version: z.literal("product-projects-2026"),
  projects: z.array(z.object({
    slug,
    title: z.string().min(1).max(220),
    summary: z.string().min(1),
    problem: z.string().min(1),
    solutionFile: z.string().regex(/^projects\/[a-z0-9-]+\.md$/),
    role: z.string().min(1),
    outcome: z.string().min(1),
    stack: z.array(z.string().min(1).max(60)).min(1),
    year: z.number().int().min(1900).max(2100),
    month: z.number().int().min(1).max(12),
    categorySlug: slug,
    featured: z.boolean(),
    sortOrder: z.number().int(),
    asset: slug,
    links: z.array(z.object({
      label: z.string().min(1),
      url: z.string().url().refine(value => new URL(value).protocol === "https:"),
    })),
  })).min(1),
});

export function parseProductManifest(value) {
  const manifest = manifestSchema.parse(value);
  if (new Set(manifest.projects.map(project => project.slug)).size !== manifest.projects.length)
    throw new Error("Duplicate project slugs in product package");
  return manifest;
}

export async function loadProductProjects(root = packageRoot) {
  const manifest = parseProductManifest(JSON.parse(await readFile(path.join(root, "manifest.json"), "utf8")));
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const projects = [];
  for (const entry of manifest.projects) {
    const solution = (await readFile(path.join(root, entry.solutionFile), "utf8")).trim();
    const source = path.join(root, "assets", `${entry.asset}.webp`);
    await readFile(source);
    const relative = `projects/${entry.slug}/products-2026-${entry.asset}.webp`;
    projects.push({
      categorySlug: entry.categorySlug,
      source,
      relative,
      data: {
        title: entry.title,
        slug: entry.slug,
        summary: entry.summary,
        problem: entry.problem,
        solution: `**Project date: ${months[entry.month - 1]} ${entry.year}.**\n\n${solution}`,
        role: entry.role,
        outcome: entry.outcome,
        stack: entry.stack,
        year: entry.year,
        featured: entry.featured,
        sortOrder: entry.sortOrder,
        status: "published",
        coverImageUrl: `/uploads/${relative}`,
        links: entry.links,
      },
    });
  }
  return projects;
}

export async function stageProductAsset(source, destination) {
  await mkdir(path.dirname(destination), { recursive: true });
  try {
    await copyFile(source, destination, constants.COPYFILE_EXCL);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const hash = bytes => createHash("sha256").update(bytes).digest("hex");
    if (hash(await readFile(source)) !== hash(await readFile(destination)))
      throw new Error(`Refusing to overwrite a different asset: ${destination}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (!(args.length === 0 || (args.length === 1 && args[0] === "--apply")))
    throw new Error("Usage: npm run content:add-products [-- --apply]");
  const target = new URL(process.env.DATABASE_URL);
  const uploadRoot = path.resolve(apiRoot, process.env.UPLOAD_DIR || "storage/uploads");
  console.log(`Database: ${target.hostname}:${target.port || "5432"}${target.pathname}`);
  console.log(`Upload directory: ${uploadRoot}`);
  const projects = await loadProductProjects();
  const prisma = new PrismaClient();
  try {
    const pending = [];
    for (const project of projects) {
      const existing = await prisma.project.findUnique({ where: { slug: project.data.slug }, select: { id: true } });
      if (existing) {
        console.log(`Already exists; preserved without changes: ${project.data.slug}`);
        continue;
      }
      const category = await prisma.category.findUnique({ where: { slug: project.categorySlug }, select: { id: true } });
      if (!category) throw new Error(`Required existing category not found: ${project.categorySlug}`);
      pending.push({ ...project, data: { ...project.data, id: randomUUID(), categoryId: category.id } });
      console.log(`Create project: ${project.data.slug}`);
    }
    if (!args.includes("--apply")) {
      console.log(`Dry run: ${pending.length} projects would be created. No existing records would change.`);
      return;
    }
    if (pending.length === 0) {
      console.log("Nothing to import. Existing admin edits were preserved.");
      return;
    }
    const backupRoot = path.join(apiRoot, "storage/backups");
    await mkdir(backupRoot, { recursive: true });
    const backupPath = path.join(backupRoot, `product-projects-2026-${Date.now()}-${randomUUID()}.json`);
    await writeFile(backupPath, JSON.stringify({
      version: "product-projects-2026",
      createdAt: new Date().toISOString(),
      existingProjects: await prisma.project.findMany(),
      plannedCreates: pending.map(project => project.data),
    }, null, 2), { flag: "wx", mode: 0o600 });
    console.log(`Project snapshot: ${backupPath}`);
    for (const project of pending)
      await stageProductAsset(project.source, path.join(uploadRoot, project.relative));
    const created = await prisma.$transaction(async tx => {
      // Serialize this package only; unrelated admin edits and submissions continue normally.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(2026, 104)`;
      const ids = [];
      for (const project of pending) {
        const existing = await tx.project.findUnique({ where: { slug: project.data.slug }, select: { id: true } });
        if (existing) continue;
        const row = await tx.project.create({ data: project.data, select: { id: true, slug: true } });
        ids.push(row);
      }
      return ids;
    }, { timeout: 30000 });
    console.log(`Created ${created.length} projects. Existing projects, blogs, contacts, comments, and accounts were not modified.`);
    console.log(JSON.stringify(created, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
