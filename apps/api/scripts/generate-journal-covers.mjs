import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { createRequire } from "node:module";
import { createHash, randomBytes } from "node:crypto";
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadArchive } from "./import-journal-archive.mjs";
import { stageProductAsset } from "./import-product-projects.mjs";
import { providerUsage, providerDiagnostics } from "./editorial-worker.mjs";

const require = createRequire(import.meta.url);
const { budgetAllows, costEstimate, IMAGE_MODEL, PRICING, STAGES, jakartaDay } = require("../dist/lib/editorial-policy.js");
const { generatedImageType } = require("../dist/lib/generated-image.js");
const directory = fileURLToPath(new URL("../content/journal-archive/", import.meta.url));
const manifestFile = path.join(directory, "manifest.json");
export async function coverPrompts() {
  return JSON.parse(await readFile(path.join(directory, "cover-prompts.json"), "utf8"));
}
export function archiveCoverPrompt(post, prompts) {
  const subject = prompts[post.file.replace(/\.md$/, "")];
  if (!subject) throw new Error(`Missing cover prompt for ${post.slug}`);
  return `Create original professional editorial artwork for the article "${post.title}". Wide 16:9 landscape composition with the main subject fully visible and generous safe margins. ${subject} High-quality materials, sharp details, polished contemporary art direction, readable at thumbnail size. No text, watermark, trademarks, decorative glowing orbs, fake screenshots, or claims of laboratory accuracy. This is a conceptual illustration, not a factual photograph.`;
}
export async function generateCovers({ apply = false, client = new PrismaClient({ log: ["error"] }), fetchImpl = fetch } = {}) {
  try {
    const archive = await loadArchive();
    const prompts = await coverPrompts();
    const seeds = await client.blogPost.findMany({ where: { slug: { in: archive.posts.map((post) => post.slug) }, deletedAt: null } });
    const work = archive.posts.map((post) => {
      const current = seeds.find((row) => row.slug === post.slug);
      if (!current || current.title !== post.title || current.content !== post.content || ![archive.version, archive.retireSeedVersion].includes(current.editorialMeta?.seedVersion)) throw new Error(`Refusing to replace an edited or unrecognized seed: ${post.slug}`);
      const prompt = archiveCoverPrompt(post, prompts);
      const hash = createHash("sha256").update(prompt).digest("hex").slice(0, 16);
      return { post, current, prompt, hash };
    }).filter(({ post, current, hash }) => !post.coverGeneration?.manuallySelected && current.editorialMeta?.coverGeneration?.promptHash !== hash);
    console.log(JSON.stringify({ mode: apply ? "generate" : "dry-run", covers: work.map(({ post }) => post.slug), unchangedArticleText: true, scheduledAutomationUnchanged: true, reservationPerImageUsd: STAGES.cover }, null, 2));
    if (!apply || !work.length) return;
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is missing");
    const backupDir = path.resolve(process.env.EDITORIAL_BACKUP_DIR ?? "storage/backups", `journal-covers-${new Date().toISOString().replaceAll(":", "-")}`);
    await mkdir(backupDir, { recursive: true });
    await writeFile(path.join(backupDir, "backup.json"), JSON.stringify({ posts: work.map(({ current }) => ({ id: current.id, slug: current.slug, coverImageUrl: current.coverImageUrl, editorialMeta: current.editorialMeta, updatedAt: current.updatedAt })) }, null, 2), { flag: "wx", mode: 0o600 });
    await mkdir(path.join(directory, "assets"), { recursive: true });
    for (const { post, current, prompt, hash } of work) {
      const topicKey = `archive-cover:${post.slug}:${hash}`;
      const job = await client.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM editorial_settings WHERE id = 'default' FOR UPDATE`;
        const config = await tx.editorialSettings.findUniqueOrThrow({ where: { id: "default" } });
        if (await tx.editorialJob.findFirst({ where: { status: "running" } })) throw new Error("A generation job is already running");
        if (await tx.editorialJob.findUnique({ where: { topicKey } })) throw new Error("This cover already has a generation attempt; inspect its usage before retrying");
        const { start, end } = require("../dist/lib/editorial-policy.js").monthRange(new Date().toISOString().slice(0, 7));
        const logs = await tx.aIUsageLog.findMany({ where: { createdAt: { gte: start, lt: end } }, select: { estimatedUsd: true, reservedUsd: true } });
        const committed = logs.reduce((total, log) => total + Number(log.estimatedUsd ?? log.reservedUsd), 0);
        if (!budgetAllows(Number(config.monthlyBudgetUsd), committed, STAGES.cover)) throw new Error("Monthly budget reached");
        const day = jakartaDay();
        const previous = await tx.editorialJob.aggregate({ where: { day, slot: { lt: 0 } }, _min: { slot: true } });
        // Negative slots identify explicit asset maintenance, not scheduled news drafts.
        const job = await tx.editorialJob.create({ data: { day, slot: (previous._min.slot ?? 0) - 1, topicKey, title: `Cover: ${post.title}`.slice(0, 220), leaseToken: randomBytes(24).toString("hex"), leaseUntil: new Date(Date.now() + 30 * 60_000), emailStatus: "not_required" } });
        await tx.aIUsageLog.create({ data: { jobId: job.id, stage: "cover", model: IMAGE_MODEL, reservedUsd: STAGES.cover, pricing: PRICING } });
        return job;
      });
      let accounted = false;
      const started = Date.now();
      try {
        const response = await fetchImpl("https://api.openai.com/v1/images/generations", { method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: IMAGE_MODEL, prompt, size: "1536x864", quality: "medium", output_format: "webp", n: 1 }), signal: AbortSignal.timeout(300000) });
        const data = await response.json();
        const usage = response.ok ? providerUsage("cover", data) : null;
        const rejected = !response.ok && [400, 401, 403, 404, 429].includes(response.status);
        const status = usage ? "completed" : rejected ? "rejected" : "unknown";
        await client.aIUsageLog.update({ where: { jobId_stage: { jobId: job.id, stage: "cover" } }, data: { status, estimatedUsd: usage ? costEstimate("cover", usage) : rejected ? 0 : null, inputTokens: usage?.input ?? 0, cachedTokens: usage?.cached ?? 0, outputTokens: usage?.output ?? 0, requestId: response.headers.get("x-request-id"), durationMs: Date.now() - started, completedAt: new Date() } });
        accounted = true;
        if (!response.ok) { console.error("OpenAI cover request rejected:", JSON.stringify(providerDiagnostics(response.status, data))); throw new Error("PROVIDER_ERROR"); }
        if (!usage || !data.data?.[0]?.b64_json) throw new Error("GENERATION_FAILED");
        const bytes = Buffer.from(data.data[0].b64_json, "base64");
        const image = generatedImageType(bytes);
        if (!image) throw new Error("UPLOAD_FAILED");
        const filename = `${post.slug}-${createHash("sha256").update(bytes).digest("hex").slice(0, 12)}.${image.extension}`;
        const source = path.join(directory, "assets", filename);
        await writeFile(source, bytes, { flag: "wx" }).catch(async (error) => {
          if (error.code !== "EEXIST" || !(await readFile(source)).equals(bytes)) throw error;
        });
        const uploads = path.resolve(process.env.UPLOAD_DIR ?? "storage/uploads");
        await stageProductAsset(source, path.join(uploads, "blogs", "archive", filename));
        const meta = { ...current.editorialMeta, coverProvenance: "AI-generated editorial illustration; not a product screenshot", coverGeneration: { jobId: job.id, promptHash: hash, model: IMAGE_MODEL, generatedAt: new Date().toISOString() } };
        const updated = await client.blogPost.updateMany({ where: { id: current.id, updatedAt: current.updatedAt, deletedAt: null }, data: { coverImageUrl: `/uploads/blogs/archive/${filename}`, editorialMeta: meta } });
        if (updated.count !== 1) throw new Error("Article changed while generating its cover; new image saved without overwriting the edit");
        const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
        Object.assign(manifest.posts.find((row) => row.slug === post.slug), { coverAsset: filename, coverGeneration: { promptHash: hash, model: IMAGE_MODEL, quality: "medium", generatedAt: meta.coverGeneration.generatedAt } });
        await writeFile(`${manifestFile}.tmp`, `${JSON.stringify(manifest, null, 2)}\n`);
        await rename(`${manifestFile}.tmp`, manifestFile);
        await client.editorialJob.update({ where: { id: job.id }, data: { status: "completed", finishedAt: new Date() } });
        console.log(`Cover ready: ${post.slug} (${image.extension}, estimated $${costEstimate("cover", usage).toFixed(6)})`);
      } catch (error) {
        if (!accounted) await client.aIUsageLog.update({ where: { jobId_stage: { jobId: job.id, stage: "cover" } }, data: { status: "unknown", durationMs: Date.now() - started, completedAt: new Date() } });
        await client.editorialJob.update({ where: { id: job.id }, data: { status: "failed", errorCode: error.message === "PROVIDER_ERROR" ? "PROVIDER_ERROR" : "UPLOAD_FAILED", finishedAt: new Date() } });
        throw error;
      }
    }
    console.log(`Cover backup: ${path.join(backupDir, "backup.json")}`);
  } finally { await client.$disconnect(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await generateCovers({ apply: process.argv.includes("--apply") });
