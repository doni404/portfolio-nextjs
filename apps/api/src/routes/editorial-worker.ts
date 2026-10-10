import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "../lib/prisma";
import { UPLOAD_ROOT } from "../lib/uploads";
import { ok } from "../lib/response";
import { badRequest } from "../lib/errors";
import { generatedImageType } from "../lib/generated-image";
import { articleWordCount, readingTimeMinutes } from "../lib/reading-time";
import { inlineVisualIssues, installInlineVisuals } from "../lib/editorial-visuals";
import { requireWorker, claimJob, lease, committedCost, notifyReview, assertFreshStory, settings } from "../lib/editorial";
import { budgetAllows, costEstimate, draftSchema, IMAGE_MODEL, PRICING, stageSchema, STAGES, TEXT_MODEL } from "../lib/editorial-policy";
import failures from "../lib/editorial-failures.json";

const router = Router();
router.use(requireWorker);
router.param("id", (_req, _res, next, value) => {
  const result = z.string().uuid().safeParse(value);
  next(result.success ? undefined : badRequest("Invalid job ID"));
});
const authSchema = z.object({ token: z.string().length(48) });
router.post("/heartbeat", async (req, res, next) => {
  try {
    z.object({ ready: z.literal(true) }).parse(req.body);
    await settings();
    const config = await prisma.editorialSettings.update({ where: { id: "default" }, data: { workerLastSeenAt: new Date() } });
    return ok(res, { connected: true, lastSeenAt: config.workerLastSeenAt });
  } catch (err) { next(err); }
});
router.post("/claim", async (_req, res, next) => { try { return ok(res, await claimJob()); } catch (e) { next(e); } });
router.post("/:id/reserve", async (req, res, next) => {
  try {
    const { token, stage } = authSchema.extend({ stage: stageSchema }).parse(req.body);
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM editorial_settings WHERE id = 'default' FOR UPDATE`;
      await lease(tx, req.params.id, token);
      const config = await tx.editorialSettings.findUniqueOrThrow({ where: { id: "default" } });
      if (!config.enabled) throw badRequest("Automation is OFF");
      if (!budgetAllows(Number(config.monthlyBudgetUsd), await committedCost(tx), STAGES[stage])) throw badRequest("Monthly budget reached");
      // A stage is never executed twice; retries cannot accidentally incur another charge.
      if (await tx.aIUsageLog.findUnique({ where: { jobId_stage: { jobId: req.params.id, stage } } })) throw badRequest("Stage already reserved; reconcile the existing request");
      if (stage !== "research") {
        const previous = ["writing", "source_resolution"].includes(stage) ? "research" : stage === "review" ? "writing" : stage === "revision_review" ? "revision" : "review";
        const log = await tx.aIUsageLog.findUnique({ where: { jobId_stage: { jobId: req.params.id, stage: previous } } });
        if (log?.status !== "completed") throw badRequest("Previous stage is incomplete");
        if (stage === "writing") {
          const resolution = await tx.aIUsageLog.findUnique({ where: { jobId_stage: { jobId: req.params.id, stage: "source_resolution" } } });
          if (resolution && resolution.status !== "completed") throw badRequest("Source resolution is incomplete");
        }
        if (stage === "cover") {
          const revision = await tx.aIUsageLog.findUnique({ where: { jobId_stage: { jobId: req.params.id, stage: "revision" } } });
          const reviewed = await tx.aIUsageLog.findUnique({ where: { jobId_stage: { jobId: req.params.id, stage: "revision_review" } } });
          if (revision && (revision.status !== "completed" || reviewed?.status !== "completed")) throw badRequest("Revision review is incomplete");
        }
      }
      await tx.editorialJob.update({ where: { id: req.params.id }, data: { leaseUntil: new Date(Date.now() + 30 * 60_000) } });
      return tx.aIUsageLog.create({ data: { jobId: req.params.id, stage, model: stage === "cover" ? IMAGE_MODEL : TEXT_MODEL, reservedUsd: STAGES[stage], pricing: PRICING } });
    });
    return ok(res, result);
  } catch (e) { next(e); }
});
router.post("/:id/usage", async (req, res, next) => {
  try {
    // Accept actual reported usage, independently of the requested tool-call limit.
    const body = authSchema.extend({ stage: stageSchema, requestId: z.string().max(160).nullable(), durationMs: z.number().int().min(0).max(3600000), status: z.enum(["completed", "unknown", "rejected"]), usage: z.object({ input: z.number().int().nonnegative(), cached: z.number().int().nonnegative(), output: z.number().int().nonnegative(), search: z.number().int().min(0).max(100), imageInput: z.number().int().nonnegative(), imageText: z.number().int().nonnegative() }) }).parse(req.body);
    if (body.usage.cached > body.usage.input) throw badRequest("Invalid cached token count");
    const result = await prisma.$transaction(async (tx) => {
      await lease(tx, req.params.id, body.token, true);
      const log = await tx.aIUsageLog.findUniqueOrThrow({ where: { jobId_stage: { jobId: req.params.id, stage: body.stage } } });
      if (log.status !== "reserved") return log;
      const estimate = body.status === "completed" ? costEstimate(body.stage, body.usage, log.pricing as unknown as typeof PRICING) : body.status === "rejected" ? 0 : null;
      return tx.aIUsageLog.update({ where: { id: log.id }, data: { status: body.status, estimatedUsd: estimate, inputTokens: body.usage.input, cachedTokens: body.usage.cached, outputTokens: body.usage.output, searchCalls: body.usage.search, durationMs: body.durationMs, requestId: body.requestId, completedAt: new Date() } });
    });
    return ok(res, result);
  } catch (e) { next(e); }
});
router.post("/:id/topic", async (req, res, next) => {
  try {
    const body = authSchema.extend({ topicKey: z.string().url().max(300), title: z.string().max(220) }).parse(req.body);
    await prisma.$transaction(async (tx) => { await lease(tx, req.params.id, body.token); await tx.editorialJob.update({ where: { id: req.params.id }, data: { topicKey: body.topicKey, title: body.title } }); });
    return ok(res, { accepted: true });
  } catch (e) { next(e); }
});
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
router.post("/:id/cover", upload.single("file"), async (req, res, next) => {
  try {
    const { token } = authSchema.parse(req.body);
    await lease(prisma, req.params.id, token);
    const log = await prisma.aIUsageLog.findUnique({ where: { jobId_stage: { jobId: req.params.id, stage: "cover" } } });
    const bytes = req.file?.buffer;
    const image = generatedImageType(bytes);
    if (log?.status !== "completed" || !bytes || !image) throw badRequest("Expected a generated WebP or PNG cover");
    const dir = path.join(UPLOAD_ROOT, "blogs", "generated", req.params.id);
    await fs.mkdir(dir, { recursive: true });
    const filename = `cover.${image.extension}`;
    const file = path.join(dir, filename);
    await fs.writeFile(file, bytes, { flag: "wx" }).catch(async (err) => {
      if (err.code !== "EEXIST") throw err;
      if (!(await fs.readFile(file)).equals(bytes)) throw badRequest("An existing cover cannot be overwritten");
    });
    return ok(res, { url: `/uploads/blogs/generated/${req.params.id}/${filename}` });
  } catch (e) { next(e); }
});
router.post("/:id/complete", async (req, res, next) => {
  try {
    const body = authSchema.extend({ draft: draftSchema, coverUrl: z.string().nullable(), evidenceUrls: z.array(z.string().url()).min(2).max(30) }).parse(req.body);
    assertFreshStory(body.draft.storyDate);
    if (body.draft.sources.some((source) => !body.evidenceUrls.includes(source.url))) throw badRequest("Draft source was not found in research evidence");
    if (/<\/?(?:script|iframe|style|object)\b/i.test(body.draft.content)) throw badRequest("Unsafe generated content");
    if (body.draft.inlineVisuals !== undefined && inlineVisualIssues(body.draft).length) throw badRequest("Inline visuals are missing or incorrectly placed");
    if (body.coverUrl && !["webp", "png"].some((extension) => body.coverUrl === `/uploads/blogs/generated/${req.params.id}/cover.${extension}`)) throw badRequest("Invalid cover path");
    if (body.coverUrl) await fs.access(path.join(UPLOAD_ROOT, "blogs", "generated", req.params.id, path.basename(body.coverUrl)));
    const blogId = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM editorial_settings WHERE id = 'default' FOR UPDATE`;
      const job = await lease(tx, req.params.id, body.token, true);
      if (job.blogPostId) return job.blogPostId;
      if (job.status !== "running") throw badRequest("Job no longer accepts a draft");
      const config = await tx.editorialSettings.findUniqueOrThrow({ where: { id: "default" } });
      const logs = await tx.aIUsageLog.findMany({ where: { jobId: job.id } });
      if (["research", "writing", "review"].some((stage) => !logs.some((log) => log.stage === stage && log.status === "completed"))) throw badRequest("Generation stages are incomplete");
      if (logs.some((log) => log.stage === "source_resolution" && log.status !== "completed")) throw badRequest("Source resolution is incomplete");
      if (logs.some((log) => log.stage === "revision") && ["revision", "revision_review"].some((stage) => !logs.some((log) => log.stage === stage && log.status === "completed"))) throw badRequest("Revision stages are incomplete");
      if (body.coverUrl && !logs.some((log) => log.stage === "cover" && log.status === "completed")) throw badRequest("Cover generation is incomplete");
      const author = await tx.author.findFirstOrThrow({ where: { slug: "doni-putra-purbawa" } });
      const categorySlug = body.draft.beat === "japan" ? "japan-life" : "ai-news";
      const category = await tx.category.upsert({ where: { slug: categorySlug }, update: {}, create: { slug: categorySlug, name: body.draft.beat === "japan" ? "Japan Life" : "AI & Technology", type: "blog" } });
      const sources = body.draft.sources.map((source) => `- [${source.title}](${source.url}) (${source.date})`).join("\n");
      const coverArtDirection = body.draft.coverArtDirection ? { coverArtDirection: body.draft.coverArtDirection } : {};
      const inline = await installInlineVisuals(body.draft, job.id, UPLOAD_ROOT);
      const prose = body.draft.content.replace(/\[\[visual-[12]\]\]/g, "");
      const post = await tx.blogPost.create({ data: { title: body.draft.title, slug: body.draft.slug, excerpt: body.draft.excerpt, content: `${inline.content}\n\n## Sources\n\n${sources}`, authorId: author.id, categoryId: category.id, status: "draft", storyDate: new Date(body.draft.storyDate), coverImageUrl: body.coverUrl, seoTitle: body.draft.title, seoDescription: body.draft.excerpt, readingTimeMinutes: readingTimeMinutes(prose), editorialMeta: { aiAssisted: true, wordCount: articleWordCount(prose), beat: body.draft.beat, newsworthiness: body.draft.newsworthiness, format: body.draft.format, sources: body.draft.sources, flow: body.draft.flow, inlineVisuals: inline.visuals, ...coverArtDirection, disclosure: "AI-assisted draft, reviewed by the editor before publication.", coverProvenance: body.coverUrl ? "AI-generated editorial illustration" : null } } });
      await tx.editorialJob.update({ where: { id: job.id }, data: { blogPostId: post.id, status: config.enabled ? "review" : "paused", finishedAt: new Date() } });
      return post.id;
    });
    await notifyReview(req.params.id, blogId);
    return ok(res, { blogId });
  } catch (e) { next(e); }
});
router.post("/:id/fail", async (req, res, next) => {
  try {
    const { token, code, reason } = authSchema.extend({ code: z.enum(["BUDGET_OR_DISABLED", "RESEARCH_FAILED", "GENERATION_FAILED", "QUALITY_CHECK_FAILED", "DUPLICATE_TOPIC", "UPLOAD_FAILED", "PROVIDER_ERROR"]), reason: z.string().refine((value) => Object.hasOwn(failures, value)).optional() }).parse(req.body);
    await prisma.$transaction(async (tx) => { const job = await lease(tx, req.params.id, token, true); if (!job.blogPostId) await tx.editorialJob.update({ where: { id: job.id }, data: { status: "failed", errorCode: reason ? `${code}:${reason}` : code, finishedAt: new Date() } }); });
    return ok(res, { recorded: true });
  } catch (e) { next(e); }
});
export default router;
