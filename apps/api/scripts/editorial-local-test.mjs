import "dotenv/config";
import express from "express";
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import { once } from "node:events";
import { pathToFileURL } from "node:url";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { runWorker, providerUsage } from "./editorial-worker.mjs";

const require = createRequire(import.meta.url);
export function assertLocalTest(env = process.env) {
  const database = new URL(env.DATABASE_URL ?? "");
  if (env.NODE_ENV === "production" || !["localhost", "127.0.0.1", "[::1]"].includes(database.hostname))
    throw new Error("The smoke test is restricted to a local development database");
  if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is missing");
}

export async function localTest({ resumeId, backupDir, maintenance = false } = {}) {
  assertLocalTest();
  const token = randomBytes(32).toString("hex");
  // This credential exists only for the isolated loopback test server.
  process.env.AUTOMATION_WORKER_TOKEN = token;
  process.env.EDITORIAL_WORKER_READY = "true";
  const { PrismaClient } = require("@prisma/client");
  globalThis.prisma = new PrismaClient({ log: ["error"] });
  const { prisma } = require("../dist/lib/prisma.js");
  const { settings } = require("../dist/lib/editorial.js");
  const router = require("../dist/routes/editorial-worker.js").default;
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.use("/api/editorial-worker", router);
  app.use((error, req, res, _next) => {
    console.error("Local worker route rejected:", JSON.stringify({ path: req.path, type: error.name, code: error.code, issues: error.issues?.map(({ path, code }) => ({ path, code })) }));
    res.status(error.statusCode ?? 400).json({ error: "Test request rejected" });
  });
  let server;
  let enabledAt;
  let resumed;
  const cached = new Map();
  try {
    await settings();
    if (resumeId) {
      resumed = await prisma.editorialJob.findUniqueOrThrow({ where: { id: resumeId }, include: { usage: true } });
      if (resumed.status !== "failed" || resumed.blogPostId || !resumed.usage.length || resumed.usage.some((log) => log.status !== "completed"))
        throw new Error("Only a failed local job with known, completed usage and no saved draft can be resumed");
      if (!backupDir || !path.resolve(backupDir).startsWith(`${path.resolve("storage/backups")}${path.sep}`)) throw new Error("Use a local paid-response backup");
      for (const log of resumed.usage) {
        const name = log.stage === "writing" ? "draft" : log.stage;
        const data = JSON.parse(await readFile(path.join(backupDir, `${name}.json`), "utf8"));
        const usage = providerUsage(log.stage, data);
        if (!usage || usage.input !== log.inputTokens || usage.output !== log.outputTokens) throw new Error("Saved response does not match the recorded paid usage");
        cached.set(log.stage, data);
      }
    }
    enabledAt = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM editorial_settings WHERE id = 'default' FOR UPDATE`;
      const config = await tx.editorialSettings.findUniqueOrThrow({ where: { id: "default" } });
      if (config.enabled) throw new Error("Stop scheduled automation before running the local smoke test");
      if (Number(config.monthlyBudgetUsd) <= 0) throw new Error("Configure a positive AI budget first");
      if (await tx.editorialJob.findFirst({ where: { status: "running" } })) throw new Error("A generation job is already running");
      if (maintenance && !resumed) {
        const { jakartaDay } = require("../dist/lib/editorial-policy.js");
        const day = jakartaDay();
        const previous = await tx.editorialJob.aggregate({ where: { day, slot: { lt: 0 } }, _min: { slot: true } });
        resumed = await tx.editorialJob.create({ data: { day, slot: (previous._min.slot ?? 0) - 1, leaseToken: randomBytes(24).toString("hex"), leaseUntil: new Date(Date.now() + 30 * 60_000) } });
      } else if (resumed) resumed = await tx.editorialJob.update({ where: { id: resumed.id }, data: { status: "running", errorCode: null, finishedAt: null, leaseUntil: new Date(Date.now() + 30 * 60_000) } });
      return (await tx.editorialSettings.update({ where: { id: "default" }, data: { enabled: true } })).updatedAt;
    });
    server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    const artifacts = path.resolve("storage/backups", `editorial-test-${Date.now()}`);
    await mkdir(artifacts, { recursive: true, mode: 0o700 });
    for (const [stage, data] of cached) await writeFile(path.join(artifacts, `${stage === "writing" ? "draft" : stage}.json`), JSON.stringify(data), { flag: "wx", mode: 0o600 });
    const capture = async (url, options) => {
      const target = new URL(url);
      const request = options.body instanceof FormData ? null : JSON.parse(options.body ?? "{}");
      const jsonResponse = (data) => new Response(JSON.stringify({ data }), { headers: { "Content-Type": "application/json" } });
      if (resumed && target.hostname === "127.0.0.1") {
        if (target.pathname.endsWith("/claim")) {
          const config = await settings();
          const recent = await prisma.blogPost.findMany({ where: { deletedAt: null }, select: { title: true, slug: true, editorialMeta: true }, orderBy: { createdAt: "desc" }, take: 100 });
          const attemptedTopics = await prisma.editorialJob.findMany({ where: { topicKey: { not: null } }, select: { title: true, topicKey: true }, orderBy: { createdAt: "desc" }, take: 100 });
          return jsonResponse({ job: resumed, config, recent, attemptedTopics });
        }
        if ((target.pathname.endsWith("/reserve") || target.pathname.endsWith("/usage")) && cached.has(request.stage)) return jsonResponse({ reusedPaidResponse: true });
        if (target.pathname.endsWith("/topic")) {
          const existing = await prisma.editorialJob.findUnique({ where: { topicKey: request.topicKey } });
          if (!maintenance && existing && existing.id !== resumed.id) {
            if (existing.blogPostId || existing.status !== "failed") throw new Error("The topic already has a draft or an active job");
            // Preserve the prior failed attempt and its costs; this is an explicit local recovery.
            options = { ...options, body: JSON.stringify({ ...request, topicKey: `${request.topicKey}#recovery-${resumed.id}` }) };
          }
        }
      }
      if (resumed && target.hostname === "api.openai.com") {
        const name = request.text?.format?.name ?? "cover";
        const stage = name === "draft" ? "writing" : name;
        if (cached.has(stage)) return new Response(JSON.stringify(cached.get(stage)), { headers: { "Content-Type": "application/json" } });
      }
      const response = await fetch(url, options);
      if (target.hostname === "api.openai.com" && response.ok) {
        const stage = request.text?.format?.name ?? "cover";
        // Keep paid output locally for diagnosis/recovery without repeating a charge.
        await writeFile(path.join(artifacts, `${stage}.json`), await response.clone().text(), { flag: "wx", mode: 0o600 });
      }
      return response;
    };
    console.log("Running one real generation job. No article will be published. Scheduled automation will return to OFF.");
    await runWorker({ apiUrl: `http://127.0.0.1:${server.address().port}`, workerToken: token, maxJobs: 1, fetchImpl: capture });
    console.log(`Paid response backup: ${artifacts}`);
    const job = await prisma.editorialJob.findFirst({ where: resumed ? { id: resumed.id } : { createdAt: { gte: enabledAt } }, orderBy: { createdAt: "desc" }, select: { id: true, title: true, status: true, errorCode: true, blogPostId: true, emailStatus: true, usage: { select: { stage: true, status: true, estimatedUsd: true, reservedUsd: true, inputTokens: true, outputTokens: true } } } });
    console.log(JSON.stringify({ job }, null, 2));
  } finally {
    if (enabledAt) await prisma.editorialSettings.update({ where: { id: "default" }, data: { enabled: false } });
    if (server) await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
    console.log("Local test finished. Scheduled automation is OFF.");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const resume = process.argv.indexOf("--resume");
  const backup = process.argv.indexOf("--backup");
  await localTest({ resumeId: resume >= 0 ? process.argv[resume + 1] : undefined, backupDir: backup >= 0 ? process.argv[backup + 1] : undefined, maintenance: process.argv.includes("--maintenance") });
}
