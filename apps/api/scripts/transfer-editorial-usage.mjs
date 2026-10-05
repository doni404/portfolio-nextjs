import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { z } from "zod";

const timestamp = z.string().datetime();
const money = z.string().regex(/^\d+(?:\.\d{1,6})?$/);
const logSchema = z.object({
  id: z.string().uuid(), stage: z.string().min(1).max(30), model: z.string().min(1).max(80),
  status: z.enum(["completed", "unknown", "rejected", "reserved"]), reservedUsd: money, estimatedUsd: money.nullable(),
  inputTokens: z.number().int().nonnegative(), cachedTokens: z.number().int().nonnegative(), outputTokens: z.number().int().nonnegative(), searchCalls: z.number().int().nonnegative(),
  requestId: z.string().max(160).nullable(), durationMs: z.number().int().nonnegative().nullable(), pricing: z.record(z.unknown()),
  createdAt: timestamp, completedAt: timestamp.nullable(),
}).strict();
const jobSchema = z.object({
  id: z.string().uuid(), day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), title: z.string().max(220).nullable(),
  status: z.enum(["completed", "failed", "review", "paused"]), errorCode: z.string().max(80).nullable(),
  createdAt: timestamp, finishedAt: timestamp.nullable(), usage: z.array(logSchema).min(1).max(20),
}).strict();
export function validateUsageHistory(value) {
  const history = z.object({ version: z.literal(1), jobs: z.array(jobSchema).max(1000) }).strict().parse(value);
  const ids = history.jobs.flatMap((job) => [job.id, ...job.usage.map((log) => log.id)]);
  if (new Set(ids).size !== ids.length) throw new Error("Duplicate history IDs");
  for (const job of history.jobs) if (new Set(job.usage.map((log) => log.stage)).size !== job.usage.length) throw new Error("Duplicate usage stages");
  return history;
}
export async function transferUsage({ exportFile, importFile, apply = false, client = new PrismaClient({ log: ["error"] }) }) {
  try {
    if (Boolean(exportFile) === Boolean(importFile)) throw new Error("Choose exactly one --export or --import file");
    if (exportFile) {
      const rows = await client.editorialJob.findMany({ where: { status: { not: "running" }, usage: { some: {} } }, include: { usage: true }, orderBy: { createdAt: "asc" } });
      // Deliberately exclude credentials, leases, account data and draft contents.
      const history = validateUsageHistory({ version: 1, jobs: rows.map((job) => ({
        id: job.id, day: job.day, title: job.title, status: job.status, errorCode: job.errorCode,
        createdAt: job.createdAt.toISOString(), finishedAt: job.finishedAt?.toISOString() ?? null,
        usage: job.usage.map(({ id, stage, model, status, reservedUsd, estimatedUsd, inputTokens, cachedTokens, outputTokens, searchCalls, requestId, durationMs, pricing, createdAt, completedAt }) => ({
          id, stage, model, status, reservedUsd: String(reservedUsd), estimatedUsd: estimatedUsd == null ? null : String(estimatedUsd), inputTokens, cachedTokens, outputTokens, searchCalls, requestId, durationMs, pricing, createdAt: createdAt.toISOString(), completedAt: completedAt?.toISOString() ?? null,
        })),
      })) });
      await writeFile(exportFile, `${JSON.stringify(history)}\n`, { flag: "wx", mode: 0o600 });
      console.log(JSON.stringify({ exportedJobs: history.jobs.length, paidApiCalls: 0 }));
      return;
    }
    const history = validateUsageHistory(JSON.parse(await readFile(importFile, "utf8")));
    const present = await client.editorialJob.findMany({ where: { id: { in: history.jobs.map((job) => job.id) } }, select: { id: true } });
    const missing = history.jobs.filter((job) => !present.some((row) => row.id === job.id));
    console.log(JSON.stringify({ mode: apply ? "import" : "dry-run", missingJobs: missing.length, preservedJobs: present.length, paidApiCalls: 0 }));
    if (!apply || !missing.length) return;
    await client.$transaction(async (tx) => {
      await tx.editorialSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
      await tx.$queryRaw`SELECT id FROM editorial_settings WHERE id = 'default' FOR UPDATE`;
      const config = await tx.editorialSettings.findUniqueOrThrow({ where: { id: "default" } });
      if (config.enabled) throw new Error("Turn automation OFF before importing historical costs");
      for (const job of missing) {
        if (await tx.editorialJob.findUnique({ where: { id: job.id } })) continue;
        const previous = await tx.editorialJob.aggregate({ where: { day: job.day, slot: { lt: 0 } }, _min: { slot: true } });
        const { usage, ...fields } = job;
        await tx.editorialJob.create({ data: {
          ...fields, title: `Local test: ${job.title ?? job.id}`.slice(0, 220), slot: (previous._min.slot ?? 0) - 1,
          status: job.status === "failed" ? "failed" : "completed", leaseToken: randomBytes(24).toString("hex"), leaseUntil: new Date(0), emailStatus: "not_required",
          usage: { create: usage },
        } });
      }
    }, { timeout: 30000 });
  } finally { await client.$disconnect(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const value = (flag) => process.argv.includes(flag) ? process.argv[process.argv.indexOf(flag) + 1] : undefined;
  await transferUsage({ exportFile: value("--export"), importFile: value("--import"), apply: process.argv.includes("--apply") });
}
