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
let listedPosts = [];
const uploadDir = await mkdtemp(path.join(tmpdir(), "editorial-upload-test-"));
process.env.UPLOAD_DIR = uploadDir;
const db = {
  $queryRaw: async () => [],
  $transaction: async (run) => run(db),
  editorialSettings: { upsert: async () => config, findUniqueOrThrow: async () => config, update: async ({data}) => (config = {...config, ...data}) },
  editorialJob: { findUnique: async () => job, findUniqueOrThrow: async () => job, findFirst: async () => null, findMany: async () => [], count: async ({ where }) => { quotaFilter = where; return 2; }, create: async ({ data }) => (job = { id: jobId, status: "running", ...data }), update: async ({ data }) => (job = { ...job, ...data }), updateMany: async ({ where, data }) => {
    if (where.emailStatus !== job.emailStatus) return { count: 0 };
    job = { ...job, ...data }; return { count: 1 };
  } },
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
    findMany: async (query) => { publicQuery = query; return listedPosts; },
    count: async () => listedPosts.length,
    create: async ({ data }) => { createdPost = data; post = { id: blogId, ...data }; return post; },
    findFirst: async () => post,
    findUniqueOrThrow: async () => post,
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
    await t.test("admin journal lists include cover URLs for thumbnails", async () => {
      const coverImageUrl = `/uploads/blogs/generated/${jobId}/cover.webp`;
      listedPosts = [{ id: blogId, title: "Article with a generated cover", coverImageUrl, tags: [] }];
      try {
        const result = await fetch(`${base}/blogs`, { headers: { Authorization: `Bearer ${adminToken}` } });
        assert.equal(result.status, 200);
        assert.equal(publicQuery.select.coverImageUrl, true);
        assert.equal((await result.json()).data[0].coverImageUrl, coverImageUrl);
      } finally { listedPosts = []; }
    });
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
    await t.test("source resolution requires completed research and blocks writing if uncertain", async () => {
      const previousLogs = logs;
      try {
        assert.equal((await request(`/worker/${jobId}/reserve`, { token: leaseToken, stage: "source_resolution" })).status, 400);
        logs = [{ stage: "research", status: "completed", estimatedUsd: 0.01 }];
        assert.equal((await request(`/worker/${jobId}/reserve`, { token: leaseToken, stage: "source_resolution" })).status, 200);
        assert.equal(logs[1].reservedUsd, 0.10);
        assert.equal((await request(`/worker/${jobId}/reserve`, { token: leaseToken, stage: "source_resolution" })).status, 400);
        assert.equal((await request(`/worker/${jobId}/reserve`, { token: leaseToken, stage: "writing" })).status, 400);
        logs[1].status = "unknown";
        assert.equal((await request(`/worker/${jobId}/reserve`, { token: leaseToken, stage: "writing" })).status, 400);
        logs[1].status = "completed"; logs[1].estimatedUsd = 0.001;
        assert.equal((await request(`/worker/${jobId}/reserve`, { token: leaseToken, stage: "writing" })).status, 200);
      } finally { logs = previousLogs; }
    });
    await t.test("actual search usage above the requested limit is recorded without clipping", async () => {
      const previousLogs = logs;
      try {
        logs = [];
        assert.equal((await request(`/worker/${jobId}/reserve`, { token: leaseToken, stage: "research" })).status, 200);
        const report = { token: leaseToken, stage: "research", requestId: "four-searches", durationMs: 20000, status: "completed", usage: { input: 1000, output: 500, cached: 200, search: 4, imageInput: 0, imageText: 0 } };
        assert.equal((await request(`/worker/${jobId}/usage`, { ...report, usage: { ...report.usage, search: 101 } })).status, 400);
        assert.equal(logs[0].status, "reserved");
        assert.equal((await request(`/worker/${jobId}/usage`, report)).status, 200);
        assert.equal(logs[0].status, "completed");
        assert.equal(logs[0].searchCalls, 4);
        assert.equal(logs[0].estimatedUsd, 0.040332);
        assert.equal((await request(`/worker/${jobId}/reserve`, { token: leaseToken, stage: "writing" })).status, 200);
      } finally { logs = previousLogs; }
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
    await t.test("the dashboard reports the saved mix and worker claims receive its daily count", async () => {
      const previous = { ...config };
      const previousJob = job;
      try {
        config.topics = ["AI", "Japan life & practical hacks"]; config.dailyLimit = 3;
        const overview = await fetch(`${base}/settings`, { headers: { Authorization: `Bearer ${adminToken}` } });
        const data = (await overview.json()).data;
        assert.deepEqual(data.dailyPlan.map((slot) => slot.group), ["japan", "other", "other"]);
        const claim = await request("/worker/claim");
        const claimed = (await claim.json()).data;
        assert.equal(claimed.config.dailyLimit, 3);
        assert.equal(claimed.job.slot, 3);
      } finally { config = previous; job = previousJob; }
    });
    await t.test("SES test email is owner-only, uses the saved recipient, and audits acceptance", async () => {
      const { SESv2Client } = require("@aws-sdk/client-sesv2");
      const previousSend = SESv2Client.prototype.send;
      const keys = ["EDITORIAL_EMAIL_PROVIDER", "SES_REGION", "EDITORIAL_EMAIL_FROM", "EDITORIAL_EMAIL_REPLY_TO", "FRONTEND_URL"];
      const previousEnv = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
      const previousRecipient = config.recipientEmail;
      const sent = [];
      try {
        Object.assign(process.env, { EDITORIAL_EMAIL_PROVIDER: "ses", SES_REGION: "ap-southeast-1", EDITORIAL_EMAIL_FROM: "info@doniputra.com", EDITORIAL_EMAIL_REPLY_TO: "editor@example.com", FRONTEND_URL: "https://doniputra.com" });
        SESv2Client.prototype.send = async (command) => { sent.push(command.input); return { MessageId: "fake-id" }; };
        config.recipientEmail = "saved@example.com";
        assert.equal((await request("/settings/email/test", {}, "wrong")).status, 401);
        const editorToken = jwt.sign({ adminId: jobId, role: "editor" }, process.env.JWT_SECRET);
        assert.equal((await request("/settings/email/test", {}, editorToken)).status, 403);
        const result = await request("/settings/email/test", { recipientEmail: "unapproved@example.com" }, adminToken);
        assert.equal(result.status, 200, await result.clone().text());
        assert.equal(sent.length, 1);
        assert.deepEqual(sent[0].Destination.ToAddresses, ["saved@example.com"]);
        config.recipientEmail = null;
        assert.equal((await request("/settings/email/test", {}, adminToken)).status, 400);
      } finally {
        SESv2Client.prototype.send = previousSend;
        config.recipientEmail = previousRecipient;
        for (const key of keys) if (previousEnv[key] === undefined) delete process.env[key]; else process.env[key] = previousEnv[key];
      }
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
    await t.test("long drafts install explanatory images inline without paid cover stages or publication", async () => {
      job = { ...job, status: "running", blogPostId: null };
      const date = new Date().toISOString().slice(0, 10);
      const sources = [{ title: "Announcement", url: "https://example.com/announcement", date }, { title: "Official guide", url: "https://example.com/guide", date }];
      const visual = { id: "visual-1", kind: "checklist", title: "Check before changing tools", summary: "A documented feature is only part of deciding whether a tool fits your workflow.", items: [{ label: "Read the scope", description: "Check which use cases the release actually documents." }, { label: "Review limitations", description: "Use the official guide to identify known restrictions." }], alt: "Two checks before changing tools: read the documented scope and review known limitations.", caption: "An illustrative decision checklist, not a vendor guarantee." };
      const draft = { title: "A documented developer tool announcement", beat: "engineering", newsworthiness: "A verified release changes an everyday developer workflow.", slug: "inline-visual-test", excerpt: "A sourced explanation of a developer tool and its practical limitations.", content: `${"word ".repeat(300)}\n\n[[visual-1]]\n\n${"word ".repeat(500)}`, storyDate: date, format: "explainer", sources, coverPrompt: "An editorial illustration of a developer workflow.", flow: [], inlineVisuals: [visual] };
      logs = ["research", "writing", "review"].map((stage) => ({ stage, status: "completed", estimatedUsd: 0.01 }));
      assert.equal((await request(`/worker/${jobId}/complete`, { token: leaseToken, draft: { ...draft, inlineVisuals: [] }, coverUrl: null, evidenceUrls: sources.map((source) => source.url) })).status, 400);
      const result = await request(`/worker/${jobId}/complete`, { token: leaseToken, draft, coverUrl: null, evidenceUrls: sources.map((source) => source.url) });
      assert.equal(result.status, 200, await result.text());
      assert.equal(createdPost.status, "draft");
      assert.equal(createdPost.readingTimeMinutes, 4);
      assert.equal(createdPost.editorialMeta.wordCount, 800);
      assert.equal(createdPost.editorialMeta.inlineVisuals.length, 1);
      assert.match(createdPost.content, /<figure class="article-visual">/);
      assert.doesNotMatch(createdPost.content, /\[\[visual-/);
      const asset = createdPost.editorialMeta.inlineVisuals[0];
      assert.match(await readFile(path.join(uploadDir, asset.url.slice("/uploads/".length)), "utf8"), /CHECKLIST/);
      assert.equal(logs.length, 3);
    });
    await t.test("completed-draft notifications send once, and ambiguous sends stay held", async () => {
      const { SESv2Client } = require("@aws-sdk/client-sesv2");
      const { notifyReview } = require("../dist/lib/editorial.js");
      const previousSend = SESv2Client.prototype.send;
      const keys = ["EDITORIAL_EMAIL_PROVIDER", "SES_REGION", "EDITORIAL_EMAIL_FROM", "FRONTEND_URL"];
      const previousEnv = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
      const previousRecipient = config.recipientEmail;
      let sends = 0;
      try {
        Object.assign(process.env, { EDITORIAL_EMAIL_PROVIDER: "ses", SES_REGION: "ap-southeast-1", EDITORIAL_EMAIL_FROM: "info@doniputra.com", FRONTEND_URL: "https://doniputra.com" });
        config.recipientEmail = "saved@example.com";
        job = { ...job, emailStatus: "not_sent" };
        SESv2Client.prototype.send = async () => { sends++; return { MessageId: "fake-id" }; };
        await Promise.all([notifyReview(jobId, blogId), notifyReview(jobId, blogId)]);
        assert.equal(sends, 1);
        assert.equal(job.emailStatus, "sent");
        assert.equal(await notifyReview(jobId, blogId), "sent");
        assert.equal(sends, 1);
        job = { ...job, emailStatus: "not_sent" };
        SESv2Client.prototype.send = async () => { sends++; throw Object.assign(new Error("sensitive-response"), { name: "AbortError" }); };
        assert.equal(await notifyReview(jobId, blogId), "unknown");
        assert.equal(await notifyReview(jobId, blogId), "unknown");
        assert.equal(sends, 2);
      } finally {
        SESv2Client.prototype.send = previousSend;
        config.recipientEmail = previousRecipient;
        for (const key of keys) if (previousEnv[key] === undefined) delete process.env[key]; else process.env[key] = previousEnv[key];
      }
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
