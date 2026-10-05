import { randomBytes, timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { badRequest, forbidden, unauthorized } from "./errors";
import { budgetAllows, jakartaDay, monthRange, scheduleDue, STAGES, TEXT_MODEL, IMAGE_MODEL } from "./editorial-policy";
import beats from "./editorial-beats.json";
import { ga4Configured } from "./ga4";

export function requireOwner(req: Request, _res: Response, next: NextFunction) {
  if (req.admin?.role !== "owner") return next(forbidden("Owner access required"));
  const origin = req.headers.origin;
  if (req.method !== "GET" && origin && origin !== (process.env.FRONTEND_URL ?? "http://localhost:3000") && !(process.env.NODE_ENV !== "production" && /^http:\/\/localhost:\d+$/.test(origin))) return next(forbidden("Invalid origin"));
  next();
}
export function requireWorker(req: Request, _res: Response, next: NextFunction) {
  const expected = process.env.AUTOMATION_WORKER_TOKEN ?? "";
  const actual = req.headers.authorization?.replace(/^Bearer /, "") ?? "";
  const expectedBytes = Buffer.from(expected);
  const actualBytes = Buffer.from(actual);
  if (expected.length < 32 || actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) return next(unauthorized());
  next();
}
export const settings = () => prisma.editorialSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default", topics: beats.map((beat) => beat.label) } });
export function readiness(config?: { workerLastSeenAt?: Date | null }, now = new Date()) {
  const configured = (process.env.AUTOMATION_WORKER_TOKEN?.length ?? 0) >= 32;
  const seen = config?.workerLastSeenAt?.getTime();
  return { worker: configured && seen != null && seen <= now.getTime() && now.getTime() - seen < 90 * 60_000, email: Boolean(process.env.RESEND_API_KEY && process.env.EDITORIAL_EMAIL_FROM), analytics: ga4Configured() };
}
export async function committedCost(tx: Prisma.TransactionClient, now = new Date()) {
  const { start, end } = monthRange(now.toISOString().slice(0, 7));
  const logs = await tx.aIUsageLog.findMany({ where: { createdAt: { gte: start, lt: end } }, select: { estimatedUsd: true, reservedUsd: true } });
  return logs.reduce((total, log) => total + Number(log.estimatedUsd ?? log.reservedUsd), 0);
}
export async function claimJob(now = new Date()) {
  await settings();
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM editorial_settings WHERE id = 'default' FOR UPDATE`;
    const config = await tx.editorialSettings.findUniqueOrThrow({ where: { id: "default" } });
    if (!config.enabled || !readiness(config, now).worker) return { job: null, reason: "Automation is OFF or worker has not connected" };
    if (!scheduleDue(config.runAt, now)) return { job: null, reason: `Waiting for ${config.runAt} Asia/Jakarta` };
    const running = await tx.editorialJob.findFirst({ where: { status: "running" } });
    if (running) return { job: null, reason: "A job is running or needs reconciliation" };
    const day = jakartaDay(now);
    const count = await tx.editorialJob.count({ where: { day, slot: { gt: 0 } } });
    if (count >= config.dailyLimit) return { job: null, reason: "Daily limit reached" };
    if (!budgetAllows(Number(config.monthlyBudgetUsd), await committedCost(tx), STAGES.research)) return { job: null, reason: "Monthly budget reached" };
    const job = await tx.editorialJob.create({ data: { day, slot: count + 1, leaseToken: randomBytes(24).toString("hex"), leaseUntil: new Date(Date.now() + 30 * 60_000) } });
    const recent = await tx.blogPost.findMany({ where: { deletedAt: null }, select: { title: true, slug: true, editorialMeta: true }, orderBy: { createdAt: "desc" }, take: 100 });
    const attemptedTopics = await tx.editorialJob.findMany({ where: { topicKey: { not: null }, slot: { gt: 0 } }, select: { title: true, topicKey: true }, orderBy: { createdAt: "desc" }, take: 100 });
    return { job, config: { topics: config.topics, generateImages: config.generateImages, textModel: TEXT_MODEL, imageModel: IMAGE_MODEL }, recent, attemptedTopics };
  });
}
export async function lease(tx: Prisma.TransactionClient, id: string, token: string, allowPaused = false) {
  const job = await tx.editorialJob.findUnique({ where: { id } });
  if (!job || job.leaseToken !== token || (!allowPaused && (job.status !== "running" || job.leaseUntil < new Date()))) throw forbidden("Job lease is invalid or expired");
  return job;
}
export async function notifyReview(jobId: string, blogId: string, resend = false) {
  const config = await settings();
  if (!config.recipientEmail || !readiness().email) {
    await prisma.editorialJob.update({ where: { id: jobId }, data: { emailStatus: "not_configured" } });
    return "not_configured";
  }
  const url = new URL(`/admin/blogs/${blogId}`, process.env.FRONTEND_URL ?? "http://localhost:3000").href;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `editorial-${jobId}${resend ? `-${randomBytes(8).toString("hex")}` : ""}` },
      body: JSON.stringify({ from: process.env.EDITORIAL_EMAIL_FROM, to: [config.recipientEmail], subject: "Your journal draft is ready to review", text: `A new AI-assisted draft is ready. Check facts, sources, and add your perspective before publishing.\n\nReview securely: ${url}\n\nThis draft has NOT been published.` }),
      signal: AbortSignal.timeout(15_000),
    });
    const status = response.ok ? "sent" : "failed";
    await prisma.editorialJob.update({ where: { id: jobId }, data: { emailStatus: status } });
    return status;
  } catch {
    await prisma.editorialJob.update({ where: { id: jobId }, data: { emailStatus: "failed" } });
    return "failed";
  }
}
export function assertFreshStory(date: string) {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date || parsed.getTime() > Date.now() || parsed.getTime() < Date.now() - 30 * 86400_000) throw badRequest("Automated news must have a verified event date in the last 30 days");
}
