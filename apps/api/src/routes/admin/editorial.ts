import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { ok } from "../../lib/response";
import { requireAuth } from "../../middleware/auth";
import { requireOwner, settings, readiness, notifyReview } from "../../lib/editorial";
import { monthRange, runAtSchema } from "../../lib/editorial-policy";
import { badRequest } from "../../lib/errors";

const router = Router();
router.use(requireAuth, requireOwner);
router.get("/", async (_req, res, next) => {
  try {
    const config = await settings();
    const jobs = await prisma.editorialJob.findMany({ orderBy: { createdAt: "desc" }, take: 40, select: { id: true, title: true, status: true, day: true, slot: true, blogPostId: true, errorCode: true, emailStatus: true, createdAt: true, leaseUntil: true } });
    return ok(res, { config, readiness: readiness(config), workerConfigured: (process.env.AUTOMATION_WORKER_TOKEN?.length ?? 0) >= 32, jobs });
  } catch (err) { next(err); }
});
router.patch("/", async (req, res, next) => {
  try {
    const body = z.object({ enabled: z.boolean(), dailyLimit: z.number().int().min(1).max(5), monthlyBudgetUsd: z.number().min(0).max(100), topics: z.array(z.string().trim().min(3).max(80)).min(1).max(8), recipientEmail: z.string().email().or(z.literal("")), generateImages: z.boolean(), runAt: runAtSchema.default("09:00") }).parse(req.body);
    const current = await settings();
    if (body.enabled && (!readiness(current).worker || body.monthlyBudgetUsd <= 0)) throw badRequest("Connect the worker and configure a positive budget before enabling automation. Email is optional.");
    const config = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM editorial_settings WHERE id = 'default' FOR UPDATE`;
      const result = await tx.editorialSettings.update({ where: { id: "default" }, data: { ...body, recipientEmail: body.recipientEmail || null } });
      await tx.auditLog.create({ data: { adminUserId: req.admin!.adminId, action: "editorial.settings", entityType: "editorial", metadata: { enabled: body.enabled, dailyLimit: body.dailyLimit, monthlyBudgetUsd: body.monthlyBudgetUsd, runAt: body.runAt } } });
      return result;
    });
    return ok(res, config);
  } catch (err) { next(err); }
});
router.get("/usage", async (req, res, next) => {
  try {
    const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).parse(req.query.month ?? new Date().toISOString().slice(0, 7));
    const { start, end } = monthRange(month);
    const logs = await prisma.aIUsageLog.findMany({ where: { createdAt: { gte: start, lt: end } }, orderBy: { createdAt: "desc" }, take: 1000, include: { job: { select: { title: true, blogPostId: true } } } });
    const totals = logs.reduce((sum, log) => ({ cost: sum.cost + Number(log.estimatedUsd ?? 0), held: sum.held + (log.estimatedUsd == null ? Number(log.reservedUsd) : 0), tokens: sum.tokens + log.inputTokens + log.outputTokens, calls: sum.calls + 1 }), { cost: 0, held: 0, tokens: 0, calls: 0 });
    const months = await prisma.$queryRaw<{ month: string; estimated: string; held: string; calls: number }[]>`SELECT to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM') AS month, COALESCE(sum(estimated_usd),0)::text AS estimated, COALESCE(sum(CASE WHEN estimated_usd IS NULL THEN reserved_usd ELSE 0 END),0)::text AS held, count(*)::int AS calls FROM ai_usage_logs GROUP BY month ORDER BY month DESC LIMIT 12`;
    return ok(res, { month, totals, logs, months, budget: (await settings()).monthlyBudgetUsd });
  } catch (err) { next(err); }
});
router.post("/jobs/:id/reconcile", async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const job = await prisma.editorialJob.findUniqueOrThrow({ where: { id } });
    if (job.status !== "running" || job.leaseUntil > new Date()) throw badRequest("Only expired jobs can be stopped. Uncertain charges remain reserved.");
    const result = await prisma.editorialJob.updateMany({ where: { id, status: "running", blogPostId: null, leaseUntil: { lte: new Date() } }, data: { status: "failed", errorCode: "LEASE_EXPIRED", finishedAt: new Date() } });
    if (!result.count) throw badRequest("The job already finished or renewed its lease");
    return ok(res, { stopped: true });
  } catch (err) { next(err); }
});
router.post("/jobs/:id/email", async (req, res, next) => {
  try {
    const job = await prisma.editorialJob.findUniqueOrThrow({ where: { id: z.string().uuid().parse(req.params.id) } });
    if (!job.blogPostId) throw badRequest("No draft to review");
    const status = await notifyReview(job.id, job.blogPostId, true);
    if (status !== "sent") throw badRequest("Review email was not sent. Check the email provider configuration and job history.");
    return ok(res, { sent: true });
  } catch (err) { next(err); }
});
export default router;
