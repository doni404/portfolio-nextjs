import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";
import { once } from "node:events";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const require = createRequire(import.meta.url);
const express = require("express");
const jwt = require("jsonwebtoken");
const jobId = "11111111-1111-4111-8111-111111111111";
const blogId = "22222222-2222-4222-8222-222222222222";
const workerToken = "worker-test-".repeat(4);
const leaseToken = "a".repeat(48);
let config = { enabled: true, monthlyBudgetUsd: 5, recipientEmail: null, runAt: "00:00", workerLastSeenAt: null };
let job = { id: jobId, status: "running", leaseToken, leaseUntil: new Date(Date.now() + 3600000), blogPostId: null };
let logs = [];
let post;
let createdPost;
let quotaFilter;
let categoryRequest;
let publicQuery;
const uploadDir = await mkdtemp(path.join(tmpdir(), "editorial-upload-test-"));
process.env.UPLOAD_DIR = uploadDir;
const db = {
  $queryRaw: async () => [],
  $transaction: async (run) => run(db),
  editorialSettings: { upsert: async () => config, findUniqueOrThrow: async () => config, update: async ({data}) => (config = {...config, ...data}) },
  editorialJob: { findUnique: async () => job, findFirst: async () => null, findMany: async () => [], count: async ({ where }) => { quotaFilter = where; return 2; }, update: async ({ data }) => (job = { ...job, ...data }) },
  aIUsageLog: {
    findMany: async () => logs,
    findUnique: async ({ where }) => logs.find((log) => log.stage === where.jobId_stage.stage),
    findUniqueOrThrow: async ({ where }) => logs.find((log) => log.stage === where.jobId_stage.stage),
    create: async ({ data }) => { const log = { id: `${data.stage}-log`, ...data, status: "reserved" }; logs.push(log); return log; },
    update: async ({ where, data }) => { const log = logs.find((log) => log.id === where.id); Object.assign(log, data); return log; },
  },
  author: { findFirstOrThrow: async () => ({ id: "author" }) },
  category: { upsert: async (query) => { categoryRequest = query; return { id: "category" }; } },
  blogPost: {
    findMany: async (query) => { publicQuery = query; return []; },
    count: async () => 0,
    create: async ({ data }) => { createdPost = data; post = { id: blogId, ...data }; return post; },
    findFirst: async () => post,
    update: async ({ data }) => (post = { ...post, ...data }),
  },
  auditLog: { create: async () => ({}) },
};
// All database operations in this process use a fake client; no real records are changed.
globalThis.prisma = db;
process.env.AUTOMATION_WORKER_TOKEN = workerToken;
process.env.JWT_SECRET = "test-only-admin-signing-secret";
const workerRouter = require("../dist/routes/editorial-worker.js").default;
const blogRouter = require("../dist/routes/admin/blogs.js").default;
const settingsRouter = require("../dist/routes/admin/editorial.js").default;
const publicBlogRouter = require("../dist/routes/blogs.js").default;

test("HTTP publishing, worker authentication, reservations, and cost retention", async (t) => {
  const app = express();
  app.use(express.json());
  app.use("/worker", workerRouter);
  app.use("/blogs", blogRouter);
  app.use("/settings", settingsRouter);
  app.use("/public-blogs", publicBlogRouter);
  app.use((error, _req, res, _next) => res.status(error.statusCode ?? 400).json({ message: error.message }));
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  const adminToken = jwt.sign({ adminId: jobId, role: "owner" }, process.env.JWT_SECRET);
  const request = (path, body = {}, token = workerToken) => fetch(`${base}${path}`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  try {
    await t.test("missing credentials and malformed job IDs are rejected", async () => {
      assert.equal((await request(`/worker/${jobId}/reserve`, { token: leaseToken, stage: "research" }, "wrong")).status, 401);
      assert.equal((await request("/worker/not-a-uuid/reserve", { token: leaseToken, stage: "research" })).status, 400);
    });
    await t.test("unconfigured automation cannot be enabled and non-owners cannot change it", async () => {
      const body = { enabled: true, dailyLimit: 2, monthlyBudgetUsd: 5, topics: ["AI research"], recipientEmail: "editor@example.com", generateImages: true };
      const patch = (token) => fetch(`${base}/settings`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      process.env.EDITORIAL_WORKER_READY = "false";
      assert.equal((await patch(adminToken)).status, 400);
      const editorToken = jwt.sign({ adminId: jobId, role: "editor" }, process.env.JWT_SECRET);
      assert.equal((await patch(editorToken)).status, 403);
    });
    await t.test("OFF and insufficient budget refuse a reservation without spending", async () => {
      config.enabled = false;
      assert.equal((await request(`/worker/${jobId}/reserve`, { token: leaseToken, stage: "research" })).status, 400);
      config.enabled = true; config.monthlyBudgetUsd = 0.01;
      assert.equal((await request(`/worker/${jobId}/reserve`, { token: leaseToken, stage: "research" })).status, 400);
      assert.equal(logs.length, 0);
      config.monthlyBudgetUsd = 5;
    });
    await t.test("unknown usage never releases held cost and duplicate stages are refused", async () => {
      assert.equal((await request(`/worker/${jobId}/reserve`, { token: leaseToken, stage: "research" })).status, 200);
      assert.equal((await request(`/worker/${jobId}/reserve`, { token: leaseToken, stage: "research" })).status, 400);
      const result = await request(`/worker/${jobId}/usage`, { token: leaseToken, stage: "research", requestId: "test-request", durationMs: 20, status: "unknown", usage: { input: 0, output: 0, cached: 0, search: 0, imageInput: 0, imageText: 0 } });
      assert.equal(result.status, 200);
      assert.equal(logs[0].estimatedUsd, null);
      assert.equal(logs[0].reservedUsd, 0.25);
    });
    await t.test("initial cover maintenance does not consume scheduled news quota", async () => {
      config.dailyLimit = 2;
      const heartbeat = await request("/worker/heartbeat", {ready:true});
      assert.equal(heartbeat.status, 200);
      assert.ok(config.workerLastSeenAt instanceof Date);
      const result = await request("/worker/claim");
      assert.equal(result.status, 200);
      assert.deepEqual(quotaFilter.slot, { gt: 0 });
      assert.equal((await result.json()).data.reason, "Daily limit reached. The next batch is tomorrow.");
    });
    await t.test("owners can choose the routine and email is optional after a heartbeat", async () => {
      const patch = (runAt) => fetch(`${base}/settings`, { method:"PATCH", headers:{"Content-Type":"application/json",Authorization:`Bearer ${adminToken}`},body:JSON.stringify({enabled:true,dailyLimit:2,monthlyBudgetUsd:5,topics:["AI research"],recipientEmail:"",generateImages:true,runAt}) });
      assert.equal((await patch("19:00")).status, 200);
      assert.equal(config.runAt, "19:00");
      assert.equal(config.recipientEmail, null);
      assert.equal((await patch("25:00")).status, 400);
      config.runAt = "00:00";
    });
    await t.test("generated PNG covers retain their format; unsafe bytes are refused", async () => {
      logs.push({ stage: "cover", status: "completed", estimatedUsd: 0.01 });
      const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jXioAAAAASUVORK5CYII=", "base64");
      const upload = (bytes) => {
        const form = new FormData(); form.set("token", leaseToken); form.set("file", new Blob([bytes]), "cover.webp");
        return fetch(`${base}/worker/${jobId}/cover`, { method: "POST", headers: { Authorization: `Bearer ${workerToken}` }, body: form });
      };
      assert.equal((await upload(Buffer.from("<svg/>"))).status, 400);
      const result = await upload(png);
      assert.equal(result.status, 200, await result.clone().text());
      assert.equal((await result.json()).data.url, `/uploads/blogs/generated/${jobId}/cover.png`);
      assert.ok((await readFile(path.join(uploadDir, "blogs", "generated", jobId, "cover.png"))).equals(png));
    });
    await t.test("a completed job saves a draft even when paused, never a published post", async () => {
      config.enabled = false;
      logs = ["research", "writing", "review"].map((stage) => ({ stage, status: "completed", estimatedUsd: 0.01 }));
      const date = new Date().toISOString().slice(0, 10);
      const sources = [{ title: "Announcement", url: "https://example.com/announcement", date }, { title: "Documentation", url: "https://example.com/docs", date }];
      const draft = { title: "A documented developer tool announcement", beat: "engineering", newsworthiness: "A verified developer tool changes an everyday workflow.", slug: "documented-tool", excerpt: "A sourced explanation of a developer tool and its practical limitations.", content: "Original interpretation supported by source evidence. ".repeat(30), storyDate: date, format: "explainer", sources, coverPrompt: "An editorial illustration showing a clear developer workflow.", flow: [] };
      const result = await request(`/worker/${jobId}/complete`, { token: leaseToken, draft, coverUrl: null, evidenceUrls: sources.map((source) => source.url) });
      assert.equal(result.status, 200, await result.text());
      assert.equal(createdPost.status, "draft");
      assert.equal(categoryRequest.where.slug, "ai-news");
      assert.equal(job.status, "paused");
      assert.equal(job.blogPostId, blogId);
    });
    await t.test("admin publication requires review and accepts portable generated covers", async () => {
      const patch = (body) => fetch(`${base}/blogs/${blogId}`, { method: "PATCH", headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
      assert.equal((await patch({ status: "published" })).status, 400);
      const result = await patch({ status: "published", reviewConfirmed: true, coverImageUrl: `/uploads/blogs/generated/${jobId}/cover.webp`, storyDate: new Date().toISOString().slice(0, 10) });
      assert.equal(result.status, 200, await result.text());
      assert.equal(post.status, "published");
      assert.ok(post.storyDate instanceof Date);
      assert.ok(Number.isFinite(Date.parse(post.editorialMeta.reviewedAt)));
      assert.equal(post.editorialMeta.reviewedBy, undefined);
      assert.equal(post.reviewConfirmed, undefined);
    });
    await t.test("Japan drafts use their own category and actual body reading time", async () => {
      job = { ...job, status: "running", blogPostId: null };
      const date = new Date().toISOString().slice(0, 10);
      const sources = [{ title: "Municipal announcement", url: "https://example.com/announcement", date }, { title: "Official service guide", url: "https://example.com/guide", date }];
      const draft = { title: "A documented Japan daily life change", beat: "japan", newsworthiness: "A verified local service change affects Japan residents.", slug: "japan-life-test", excerpt: "A sourced practical guide to a documented local service change in Japan.", content: "word ".repeat(1541), storyDate: date, format: "practical-guide", sources, coverPrompt: "A clear conceptual editorial scene of an everyday service in Japan.", flow: [] };
      const result = await request(`/worker/${jobId}/complete`, { token: leaseToken, draft, coverUrl: null, evidenceUrls: sources.map((source) => source.url) });
      assert.equal(result.status, 200, await result.text());
      assert.equal(categoryRequest.where.slug, "japan-life");
      assert.equal(createdPost.readingTimeMinutes, 8);
      assert.equal(createdPost.editorialMeta.wordCount, 1541);
      assert.equal(createdPost.status, "draft");
    });
    await t.test("site search filters published content and sorts newest publication first", async () => {
      const result = await fetch(`${base}/public-blogs?q=Japan`);
      assert.equal(result.status, 200);
      assert.equal(publicQuery.where.status, "published");
      assert.equal(publicQuery.where.deletedAt, null);
      assert.deepEqual(publicQuery.orderBy[0], { publishedAt: "desc" });
      assert.equal(publicQuery.where.OR[0].title.contains, "Japan");
    });
    await t.test("failure diagnostics accept only safe reason codes and preserve usage", async () => {
      config.enabled = true;
      job = { ...job, status: "running", blogPostId: null };
      const result = await request(`/worker/${jobId}/fail`, { token: leaseToken, code: "RESEARCH_FAILED", reason: "SOURCE_NOT_RETRIEVED" });
      assert.equal(result.status, 200);
      assert.equal(job.errorCode, "RESEARCH_FAILED:SOURCE_NOT_RETRIEVED");
      assert.equal(job.status, "failed");
      assert.equal(logs.length, 3);
      assert.equal((await request(`/worker/${jobId}/fail`, { token: leaseToken, code: "RESEARCH_FAILED", reason: "unsafe provider message or secret" })).status, 400);
      const overview = await fetch(`${base}/settings`, { headers: { Authorization: `Bearer ${adminToken}` } });
      assert.equal(overview.status, 200);
      const data = (await overview.json()).data;
      assert.equal(data.today.attempts, 2);
      assert.equal(data.state.code, "quota");
    });
  } finally { await new Promise((resolve) => server.close(resolve)); await rm(uploadDir, { recursive: true, force: true }); }
});
