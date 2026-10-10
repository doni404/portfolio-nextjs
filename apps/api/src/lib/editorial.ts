import { randomBytes, timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { badRequest, forbidden, unauthorized } from "./errors";
import { automationState, jakartaDay, monthRange, TEXT_MODEL, IMAGE_MODEL } from "./editorial-policy";
import beats from "./editorial-beats.json";
import { ga4Configured } from "./ga4";
import { emailConfiguration, sendEditorialEmail, reviewEmail } from "./editorial-email";

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
  return { worker: configured && seen != null && seen <= now.getTime() && now.getTime() - seen < 90 * 60_000, email: emailConfiguration() !== null, analytics: ga4Configured() };
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
    const running = await tx.editorialJob.findFirst({ where: { status: "running" } });
    const day = jakartaDay(now);
    const count = await tx.editorialJob.count({ where: { day, slot: { gt: 0 } } });
    const state = automationState({ enabled: config.enabled, worker: readiness(config, now).worker, runAt: config.runAt, attempts: count, dailyLimit: config.dailyLimit, budget: Number(config.monthlyBudgetUsd), committed: await committedCost(tx, now), runningUntil: running?.leaseUntil }, now);
    if (state.code !== "ready") return { job: null, reason: state.message };
    const job = await tx.editorialJob.create({ data: { day, slot: count + 1, leaseToken: randomBytes(24).toString("hex"), leaseUntil: new Date(Date.now() + 30 * 60_000) } });
    const recent = await tx.blogPost.findMany({ where: { deletedAt: null }, select: { title: true, slug: true, editorialMeta: true }, orderBy: { createdAt: "desc" }, take: 100 });
    const attemptedTopics = await tx.editorialJob.findMany({ where: { topicKey: { not: null }, slot: { gt: 0 } }, select: { title: true, topicKey: true }, orderBy: { createdAt: "desc" }, take: 100 });
    return { job, config: { topics: config.topics, dailyLimit: config.dailyLimit, generateImages: config.generateImages, textModel: TEXT_MODEL, imageModel: IMAGE_MODEL }, recent, attemptedTopics };
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
  const job = await prisma.editorialJob.findUniqueOrThrow({ where: { id: jobId } });
  if (job.blogPostId !== blogId) throw badRequest("Review draft does not match the job");
  if (job.emailStatus === "sending" || (!resend && ["sent", "unknown"].includes(job.emailStatus))) return job.emailStatus;
  const post = await prisma.blogPost.findUniqueOrThrow({ where: { id: blogId }, select: { title: true, excerpt: true } });
  const email = reviewEmail(config.recipientEmail, blogId, post, `editorial-${jobId}${resend ? `-${randomBytes(8).toString("hex")}` : ""}`);
  const claimed = await prisma.editorialJob.updateMany({ where: { id: jobId, emailStatus: job.emailStatus }, data: { emailStatus: "sending" } });
  if (!claimed.count) return "sending";
  const result = await sendEditorialEmail(email);
  if (result.code) console.warn("Editorial email:", result.code);
  await prisma.editorialJob.update({ where: { id: jobId }, data: { emailStatus: result.status } });
  return result.status;
}
export function assertFreshStory(date: string) {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date || parsed.getTime() > Date.now() || parsed.getTime() < Date.now() - 30 * 86400_000) throw badRequest("Automated news must have a verified event date in the last 30 days");
}
