import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";
import { generateKeyPairSync } from "node:crypto";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { loadArchive, canRetireSeed } from "../scripts/import-journal-archive.mjs";
import { runWorker, parseSignals, evidenceUrls, providerUsage, validateResearch, selectBeat, selectArticleProfile, providerDiagnostics, editorialCoverPrompt } from "../scripts/editorial-worker.mjs";
import { assertLocalTest } from "../scripts/editorial-local-test.mjs";
import { coverPrompts, archiveCoverPrompt } from "../scripts/generate-journal-covers.mjs";
import { canInstallCover } from "../scripts/install-journal-covers.mjs";
import { validateUsageHistory } from "../scripts/transfer-editorial-usage.mjs";

const require = createRequire(import.meta.url);
const { costEstimate, budgetAllows, monthRange, jakartaDay, scheduleDue, runAtSchema, coverDirectionSchema, draftSchema, storyDateSchema, blogCoverSchema, requiresEditorialReview, TEXT_MODEL, PRICING } = require("../dist/lib/editorial-policy.js");
const { readiness } = require("../dist/lib/editorial.js");
const { generatedImageType } = require("../dist/lib/generated-image.js");
const { gaRows, analyticsReport, serviceAccount, ga4Configured } = require("../dist/lib/ga4.js");
const sources = [
  { title: "Primary announcement", url: "https://example.com/announcement", date: new Date().toISOString().slice(0, 10) },
  { title: "Technical documentation", url: "https://example.com/documentation", date: new Date().toISOString().slice(0, 10) },
];
const topic = { title: "A new developer tool release", beat: "engineering", newsworthiness: "A verified tool release changes an everyday developer workflow.", storyDate: sources[0].date, primaryUrl: sources[0].url, facts: ["A documented new release."], limitations: ["Vendor claim, not independently tested."], sources };
const artDirection = { pattern: "smooth-light", reason: "An accessible practical guide benefits from calm daylight.", headline: "A BETTER WORKFLOW?", brand: null, person: null, portrait: "none" };
const draft = { title: topic.title, beat: topic.beat, newsworthiness: topic.newsworthiness, slug: "new-developer-tool", excerpt: "A practical explanation of the new developer tool and its limitations.", content: "An original explanation with sources and caveats. ".repeat(30), storyDate: topic.storyDate, format: "explainer", sources, coverPrompt: "An original professional editorial illustration of a developer workflow.", coverArtDirection: artDirection, flow: [] };
const usage = { input_tokens: 1000, output_tokens: 500, input_tokens_details: { cached_tokens: 200 } };
function modelResponse(value, { research = false, withUsage = true } = {}) {
  return { status: "completed", ...(withUsage ? { usage } : {}), output: [
    ...(research ? [{ type: "web_search_call", action: { sources: sources.map(({ url }) => ({ url })) } }] : []),
    { type: "message", content: [{ type: "output_text", text: JSON.stringify(value) }] },
  ] };
}
const response = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "x-request-id": "request-test" } });

test("usage transfers exclude credentials, live jobs and draft data", () => {
  assert.deepEqual(validateUsageHistory({ version: 1, jobs: [] }), { version: 1, jobs: [] });
  assert.throws(() => validateUsageHistory({ version: 1, jobs: [], apiKey: "secret" }));
  const job = { id: "c89972b8-8323-4afb-b38c-64b963393b4f", day: "2026-10-05", title: "Local cover test", status: "completed", errorCode: null, createdAt: "2026-10-05T00:00:00.000Z", finishedAt: null, usage: [{ id: "42c2256c-451b-4341-a85a-0fefdc1327d2", stage: "cover", model: "test-image-model", status: "unknown", reservedUsd: "0.5", estimatedUsd: null, inputTokens: 0, cachedTokens: 0, outputTokens: 0, searchCalls: 0, requestId: null, durationMs: null, pricing: {}, createdAt: "2026-10-05T00:00:00.000Z", completedAt: null }] };
  assert.equal(validateUsageHistory({ version: 1, jobs: [job] }).jobs[0].usage[0].estimatedUsd, null);
  assert.throws(() => validateUsageHistory({ version: 1, jobs: [{ ...job, status: "running" }] }));
  assert.throws(() => validateUsageHistory({ version: 1, jobs: [{ ...job, leaseToken: "secret" }] }));
  assert.throws(() => validateUsageHistory({ version: 1, jobs: [job, job] }));
});

test("live smoke tests refuse production and diagnostics never expose provider messages or keys", () => {
  assertLocalTest({ DATABASE_URL: "postgresql://localhost/portfolio", OPENAI_API_KEY: "synthetic" });
  assert.throws(() => assertLocalTest({ DATABASE_URL: "postgresql://production.example/portfolio", OPENAI_API_KEY: "synthetic" }));
  assert.throws(() => assertLocalTest({ DATABASE_URL: "postgresql://localhost/portfolio", OPENAI_API_KEY: "synthetic", NODE_ENV: "production" }));
  assert.throws(() => assertLocalTest({ DATABASE_URL: "postgresql://localhost/portfolio" }));
  assert.deepEqual(providerDiagnostics(401, { error: { type: "invalid_request_error", code: "invalid_api_key", param: null, message: "synthetic-secret-must-not-print" } }), { status: 401, type: "invalid_request_error", code: "invalid_api_key", parameter: null });
  assert.equal(providerDiagnostics(400, { error: { code: "unsafe secret text" } }).code, null);
});

test("budget reservations and token costs use the configured standard rates", () => {
  const counts = { input: 1000, cached: 200, output: 500, search: 2, imageInput: 0, imageText: 0 };
  assert.equal(TEXT_MODEL, "gpt-6-luna");
  assert.equal(costEstimate("research", counts), 0.020332);
  assert.equal(costEstimate("research", counts, { ...PRICING, input: 0.75, cached: 0.075, output: 4.5 }), 0.022865);
  assert.equal(costEstimate("cover", { ...counts, imageInput: 100, imageText: 1000 }), 0.0208);
  assert.equal(budgetAllows(5, 4.75, 0.25), true);
  assert.equal(budgetAllows(5, 4.76, 0.25), false);
  assert.equal(budgetAllows(0, 0, 0), false);
  assert.equal(monthRange("2026-12").end.toISOString(), "2027-01-01T00:00:00.000Z");
  assert.throws(() => monthRange("2026-13"));
  assert.equal(jakartaDay(new Date("2026-10-04T18:00:00Z")), "2026-10-05");
});
test("Jakarta schedule validates times and does not run before the chosen routine", () => {
  assert.equal(scheduleDue("09:00", new Date("2026-10-05T01:59:00Z")), false);
  assert.equal(scheduleDue("09:00", new Date("2026-10-05T02:00:00Z")), true);
  assert.equal(scheduleDue("19:00", new Date("2026-10-05T12:00:00Z")), true);
  assert.equal(scheduleDue("19:00", new Date("2026-10-05T17:01:00Z")), false);
  for (const invalid of ["24:00", "9:00", "12:60", "-1:00"]) assert.equal(runAtSchema.safeParse(invalid).success, false);
});
test("worker readiness comes from a fresh heartbeat, never a manual flag", () => {
  const old = process.env.AUTOMATION_WORKER_TOKEN;
  const now = new Date("2026-10-05T02:00:00Z");
  try {
    process.env.AUTOMATION_WORKER_TOKEN = "x".repeat(40);
    assert.equal(readiness(undefined, now).worker, false);
    assert.equal(readiness({ workerLastSeenAt: new Date(now - 60000) }, now).worker, true);
    assert.equal(readiness({ workerLastSeenAt: new Date(now - 90 * 60000) }, now).worker, false);
    assert.equal(readiness({ workerLastSeenAt: new Date(now.getTime() + 60000) }, now).worker, false);
    delete process.env.AUTOMATION_WORKER_TOKEN;
    assert.equal(readiness({ workerLastSeenAt: now }, now).worker, false);
  } finally { if (old === undefined) delete process.env.AUTOMATION_WORKER_TOKEN; else process.env.AUTOMATION_WORKER_TOKEN = old; }
});
test("AI-selected cover directions preserve light/dark, branding and portrait safeguards", () => {
  assert.match(editorialCoverPrompt(draft, topic), /cool white daylight/);
  assert.match(editorialCoverPrompt(draft, topic), /A BETTER WORKFLOW\?/);
  const portrait = { ...artDirection, pattern: "bold-dark", brand: "Anthropic", person: "Dario Amodei", portrait: "illustrated" };
  const prompt = editorialCoverPrompt({ ...draft, coverArtDirection: portrait }, { facts: ["Dario Amodei leads Anthropic."] });
  assert.match(prompt, /Matte charcoal/);
  assert.match(prompt, /Not a documentary photograph/);
  assert.throws(() => editorialCoverPrompt({ ...draft, coverArtDirection: portrait }, topic));
  assert.equal(coverDirectionSchema.safeParse({ ...portrait, portrait: "none" }).success, false);
  assert.equal(coverDirectionSchema.safeParse({ ...portrait, pattern: "neon" }).success, false);
});

test("generated covers recognize their actual PNG or WebP format", () => {
  assert.equal(generatedImageType(Buffer.from("RIFF1234WEBP"))?.extension, "webp");
  assert.equal(generatedImageType(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))?.extension, "png");
  assert.equal(generatedImageType(Buffer.from("<svg/>")), null);
  assert.equal(generatedImageType(), null);
});

test("drafts require real dates, distinct HTTPS sources, and a safe image path", () => {
  assert.equal(draftSchema.safeParse(draft).success, true);
  assert.equal(draftSchema.safeParse({ ...draft, sources: [sources[0], sources[0]] }).success, false);
  assert.equal(draftSchema.safeParse({ ...draft, sources: [{ ...sources[0], url: "javascript:alert(1)" }, sources[1]] }).success, false);
  assert.equal(storyDateSchema.safeParse("2026-02-30").success, false);
  assert.equal(blogCoverSchema.safeParse("/uploads/blogs/generated/id/cover.webp").success, true);
  for (const value of ["javascript:alert(1)", "//other.example/image.webp", "/uploads/blogs/../../secrets.png"]) assert.equal(blogCoverSchema.safeParse(value).success, false);
  assert.equal(requiresEditorialReview({ aiAssisted: true }, "draft", "published"), true);
  assert.equal(requiresEditorialReview({}, "draft", "published"), false);
  assert.equal(requiresEditorialReview({ aiAssisted: true }, "draft", "draft"), false);
});

test("research evidence rejects invented URLs, duplicate sources and old events", () => {
  const evidence = sources.map(({ url }) => url);
  assert.equal(validateResearch(topic, evidence).title, topic.title);
  assert.throws(() => validateResearch({ ...topic, primaryUrl: "https://fake.example/" }, evidence));
  assert.throws(() => validateResearch({ ...topic, sources: [sources[0], sources[0]] }, evidence));
  assert.throws(() => validateResearch({ ...topic, storyDate: "2024-01-01" }, evidence));
  assert.throws(() => validateResearch(topic, evidence, new Date(), "industry"));
  assert.throws(() => validateResearch({ ...topic, beat: "industry" }, evidence));
  assert.throws(() => validateResearch({ ...topic, sources: [sources[1], { ...sources[0], url: "https://example.com/other" }] }, [...evidence, "https://example.com/other"]));
  const independent = { ...sources[1], url: "https://independent.example/report" };
  assert.equal(validateResearch({ ...topic, beat: "industry", sources: [sources[0], independent] }, [sources[0].url, independent.url]).beat, "industry");
  assert.deepEqual(evidenceUrls({ output: [{ content: [{ annotations: [{ type: "url_citation", url: sources[0].url }, { type: "url_citation", url: "javascript:x" }] }] }] }), [sources[0].url]);
  assert.equal(providerUsage("research", {}), null);
  assert.equal(providerUsage("cover", { usage }), null);
  assert.equal(providerUsage("research", modelResponse(topic, { research: true })).search, 1);
});

test("RSS/Atom discovery handles multiple links and refuses XML entities", () => {
  assert.equal(parseSignals('<rss><channel><item><title>News</title><link>https://example.com/news</link></item></channel></rss>', "rss")[0].title, "News");
  const feed = '<feed><entry><title>Paper</title><link rel="related" href="https://example.com/pdf"/><link rel="alternate" href="https://example.com/paper"/><published>2026-10-05</published></entry></feed>';
  assert.equal(parseSignals(feed, "atom")[0].url, "https://example.com/paper");
  assert.throws(() => parseSignals('<!DOCTYPE rss [<!ENTITY x "bad">]><rss/>', "rss"));
  assert.equal(parseSignals('<rss><channel><item><title>Topic</title><ht:approx_traffic>10K+</ht:approx_traffic></item></channel></rss>', "rss")[0].searchInterest, "10K+");
});

test("topic rotation favors under-covered beats and caps model launches", () => {
  const job = { day: "2026-10-05", slot: 1 };
  const history = [{ title: "GPT-6 launch" }, { editorialMeta: { beat: "industry" } }, { editorialMeta: { beat: "policy" } }];
  const next = selectBeat(["AI"], history, job);
  assert.ok(["work", "products", "research", "engineering"].includes(next.id));
  assert.equal(selectBeat(["AI model releases"], history, job).id, "models");
  assert.equal(selectBeat(["Cloud, security & developer tools"], history, job).id, "engineering");
  assert.equal(selectBeat(["Robotics in farming"], history, job).id, "custom");
  const generated = [];
  for (let i = 1; i <= 30; i++) {
    const beat = selectBeat(["AI"], generated, { ...job, slot: i });
    generated.unshift({ editorialMeta: { beat: beat.id } });
    assert.ok(generated.slice(0, 5).filter((post) => post.editorialMeta.beat === "models").length <= 1);
  }
  assert.equal(new Set(generated.map((post) => post.editorialMeta.beat)).size, 7);
});

test("Japan is a separate selectable beat, not silently added to an AI-only selection", () => {
  const job = { day: "2026-10-05", slot: 1 };
  assert.equal(selectBeat(["Japan life & practical hacks"], [], job).id, "japan");
  assert.equal(selectBeat(["Daily life in Japan"], [], job).id, "japan");
  assert.equal(selectBeat(["AI", "Japan life & practical hacks"], ["industry", "policy", "work", "products", "research", "engineering", "models"].map((beat) => ({ editorialMeta: { beat } })), job).id, "japan");
  assert.notEqual(selectBeat(["AI"], [], job).id, "japan");
  assert.equal(draftSchema.safeParse({ ...draft, beat: "japan" }).success, true);
});

test("article profiles vary depth and avoid turning leadership news into tutorials", () => {
  const history = [];
  const profiles = [];
  for (let slot = 1; slot <= 12; slot++) {
    const profile = selectArticleProfile({ beat: "japan" }, history, { day: "2026-10-05", slot });
    profiles.push(profile);
    history.unshift({ editorialMeta: { format: profile.format } });
    assert.notEqual(profile.format, "paper-breakdown");
  }
  assert.ok(profiles.some((profile) => profile.minWords >= 1540));
  assert.ok(profiles.some((profile) => profile.maxWords <= 650));
  assert.equal(new Set(profiles.map((profile) => profile.format)).size, 4);
  for (let slot = 1; slot < 8; slot++) {
    assert.ok(!["paper-breakdown", "practical-guide"].includes(selectArticleProfile({ beat: "industry" }, [], { day: "2026-10-05", slot }).format));
  }
});

test("archive has exactly 5/5/3 sourced posts and no fabricated publication date", async () => {
  const archive = await loadArchive();
  const counts = archive.posts.reduce((all, post) => { const year = post.date.slice(0, 4); all[year] = (all[year] ?? 0) + 1; return all; }, {});
  assert.deepEqual(counts, { 2024: 5, 2025: 5, 2026: 3 });
  assert.equal(archive.replaceSlugs.length, 6);
  assert.equal(new Set(archive.posts.map((post) => post.slug)).size, 13);
  assert.ok(archive.posts.every((post) => post.content.includes(post.source) && /\.(webp|png)$/.test(post.assetName)));
  assert.equal(archive.posts.filter((post) => post.beat === "models").length, 2);
  assert.equal(new Set(archive.posts.map((post) => post.beat)).size, 7);
  assert.equal(archive.retirePosts.length, 10);
  assert.deepEqual(gaRows({ rows: [{ dimensionValues: [{ value: "/blogs/story" }], metricValues: [{ value: "12" }] }] }), [{ dimensions: ["/blogs/story"], metrics: [12] }]);
  assert.deepEqual(gaRows({}), []);
});

test("archive retirement preserves user edits and unrelated posts", () => {
  const original = { title: "Seed title", content: "Seed content" };
  const post = { ...original, status: "published", deletedAt: null, createdAt: new Date(0), updatedAt: new Date(0), editorialMeta: { seedVersion: "old-seed" } };
  assert.equal(canRetireSeed(post, original, "old-seed"), true);
  for (const changed of [{ title: "My title" }, { content: "My content" }, { updatedAt: new Date(1) }, { status: "draft" }, { editorialMeta: {} }]) assert.equal(canRetireSeed({ ...post, ...changed }, original, "old-seed"), false);
});

test("initial covers have distinct prompts and packaged installation preserves article edits", async () => {
  const archive = await loadArchive();
  const prompts = await coverPrompts();
  assert.equal(new Set(archive.posts.map((post) => archiveCoverPrompt(post, prompts))).size, 13);
  const post = { ...archive.posts[0], assetName: "new-cover.webp" };
  const current = { title: post.title, content: post.content, coverImageUrl: "/uploads/blogs/archive/old.webp", editorialMeta: { seedVersion: archive.version } };
  assert.equal(canInstallCover(current, post, [archive.version], current.coverImageUrl), true);
  const replacement = { ...post, previousCoverAssets: ["old-generated.webp"] };
  assert.equal(canInstallCover({ ...current, coverImageUrl: "/uploads/blogs/archive/old-generated.webp" }, replacement, [archive.version], "legacy.webp"), true);
  assert.equal(canInstallCover({ ...current, coverImageUrl: "/uploads/blogs/archive/my-upload.png" }, replacement, [archive.version], "legacy.webp"), false);
  for (const changes of [{ title: "My edit" }, { content: "My content" }, { deletedAt: new Date() }, { coverImageUrl: "/uploads/blogs/my-photo.png" }, { editorialMeta: {} }])
    assert.equal(canInstallCover({ ...current, ...changes }, post, [archive.version], current.coverImageUrl), false);
});

test("OFF worker never contacts OpenAI or discovers topics", async () => {
  let calls = 0;
  await runWorker({ apiUrl: "https://api.example.com", workerToken: "test-token", apiKey: "test-key", discover: async () => { throw new Error("Must not discover"); }, fetchImpl: async (url) => { assert.match(String(url), /\/(claim|heartbeat)$/); calls++; return response({ data: { job: null, reason: "Automation OFF" } }); } });
  assert.equal(calls, 2);
});
test("heartbeat-only mode never discovers stories or calls a paid provider", async () => {
  const calls = [];
  await runWorker({ apiUrl: "https://api.example.com", workerToken: "test-token", apiKey: "test-key", heartbeatOnly: true, discover: async () => { throw new Error("No discovery"); }, fetchImpl: async (url) => { calls.push(String(url)); return response({ data: { connected: true } }); } });
  assert.deepEqual(calls, ["https://api.example.com/api/editorial-worker/heartbeat"]);
});

test("GA4 uses read-only server credentials, actual reports, admin exclusions, and caching", async () => {
  const originalFetch = globalThis.fetch;
  const originalProperty = process.env.GA4_PROPERTY_ID;
  const originalKey = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const originalFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
  const requests = [];
  try {
    delete process.env.GA4_PROPERTY_ID; delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON; delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    assert.equal((await analyticsReport(7)).connected, false);
    process.env.GA4_PROPERTY_ID = "12345";
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({ client_email: "test@project.iam.gserviceaccount.com", private_key: privateKey });
    globalThis.fetch = async (url, options) => {
      requests.push({ url: String(url), options });
      if (String(url).includes("oauth2.googleapis.com")) return response({ access_token: "test-access-token", expires_in: 3600 });
      return response({ rows: [{ dimensionValues: [{ value: "/blogs/story" }], metricValues: [{ value: "17" }, { value: "20" }, { value: "30" }, { value: "0.5" }, { value: "45" }] }] });
    };
    const report = await analyticsReport(7);
    assert.equal(report.connected, true);
    assert.deepEqual(report.summary, [17, 20, 30, 0.5, 45]);
    assert.equal(requests.length, 6);
    const assertion = new URLSearchParams(requests[0].options.body).get("assertion");
    assert.equal(require("jsonwebtoken").decode(assertion).scope, "https://www.googleapis.com/auth/analytics.readonly");
    for (const request of requests.slice(1)) assert.match(request.url, /properties\/12345:runReport$/);
    assert.equal(JSON.parse(requests[1].options.body).dimensionFilter.notExpression.filter.stringFilter.value, "/admin");
    assert.equal(await analyticsReport(7), report);
    assert.equal(requests.length, 6);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalProperty === undefined) delete process.env.GA4_PROPERTY_ID; else process.env.GA4_PROPERTY_ID = originalProperty;
    if (originalKey === undefined) delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON; else process.env.GOOGLE_SERVICE_ACCOUNT_JSON = originalKey;
    if (originalFile === undefined) delete process.env.GOOGLE_APPLICATION_CREDENTIALS; else process.env.GOOGLE_APPLICATION_CREDENTIALS = originalFile;
  }
});

test("GA4 supports ignored credential files and never leaks malformed JSON", async () => {
  const originalKey = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const originalFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const originalProperty = process.env.GA4_PROPERTY_ID;
  const dir = await mkdtemp(path.join(tmpdir(), "ga4-test-"));
  try {
    delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    process.env.GA4_PROPERTY_ID = "12345";
    process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(dir, "key.json");
    await writeFile(process.env.GOOGLE_APPLICATION_CREDENTIALS, JSON.stringify({ client_email: "test@example.com", private_key: "synthetic-key" }), { mode: 0o600 });
    assert.equal(ga4Configured(), true);
    assert.equal((await serviceAccount()).client_email, "test@example.com");
    await writeFile(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'sensitive-synthetic-content');
    await assert.rejects(serviceAccount(), { message: "GA4 credentials are missing, unreadable, or invalid" });
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({ client_email: "inline@example.com", private_key: "synthetic-key" });
    assert.equal((await serviceAccount()).client_email, "inline@example.com");
  } finally {
    for (const [key, value] of [["GOOGLE_SERVICE_ACCOUNT_JSON", originalKey], ["GOOGLE_APPLICATION_CREDENTIALS", originalFile], ["GA4_PROPERTY_ID", originalProperty]]) if (value === undefined) delete process.env[key]; else process.env[key] = value;
    await rm(dir, { recursive: true, force: true });
  }
});

async function mockRun({ providerStatus = 200, withUsage = true, denyReservation = false, images = false, revise = false, revisionFails = false } = {}) {
  const calls = []; let paidCalls = 0; let claimed = false;
  const previousExit = process.exitCode;
  try {
    await runWorker({ apiUrl: "https://api.example.com", workerToken: "test-token", apiKey: "test-key", discover: async () => [], fetchImpl: async (url, options) => {
      const target = String(url); const body = options.body instanceof FormData ? null : JSON.parse(options.body ?? "{}");
      calls.push({ target, body });
      if (target.includes("api.openai.com")) {
        paidCalls++;
        if (providerStatus !== 200) return response({}, providerStatus);
        if (target.endsWith("images/generations")) return response({ usage: { input_tokens: 20, output_tokens: 100, input_tokens_details: { text_tokens: 20, image_tokens: 0 } }, data: [{ b64_json: Buffer.from("RIFF-test-WEBP").toString("base64") }] });
        const name = body.text.format.name;
        const approved = name === "review" ? !revise : !revisionFails;
        return response(modelResponse(name === "research" ? topic : ["draft", "revision"].includes(name) ? draft : { approved, issues: approved ? [] : ["Rewrite an overfamiliar phrase."] }, { research: name === "research", withUsage }));
      }
      if (target.endsWith("/claim")) {
        if (claimed) return response({ data: { job: null, reason: "Quota reached" } });
        claimed = true;
        return response({ data: { job: { id: "test-job", leaseToken: "lease", day: "2026-10-05", slot: 1 }, config: { topics: ["Cloud, security & developer tools"], generateImages: images }, recent: [], attemptedTopics: [{ title: "Previously attempted announcement", topicKey: "https://old.example/story" }] } });
      }
      if (denyReservation && target.endsWith("/reserve")) return response({}, 400);
      if (target.endsWith("/cover")) return response({ data: { url: "/uploads/blogs/generated/test-job/cover.webp" } });
      return response({ data: {} });
    } });
  } finally { process.exitCode = previousExit; }
  return { calls, paidCalls };
}

test("happy path reserves every paid stage, logs costs, and creates only a review draft", async () => {
  const { calls, paidCalls } = await mockRun({ images: true });
  assert.equal(paidCalls, 4);
  const textCalls = calls.filter(({ target }) => target === "https://api.openai.com/v1/responses");
  assert.ok(textCalls.every(({ body }) => body.model === TEXT_MODEL && body.reasoning.effort === "low"));
  assert.ok(textCalls.every(({ body }) => /Do not repeat generic AI-assisted/.test(body.instructions)));
  assert.ok(textCalls.every(({ body }) => /Keep caveats specific/.test(body.instructions)));
  assert.equal(calls.find(({ target }) => target.endsWith("images/generations")).body.quality, "medium");
  assert.match(textCalls[0].body.input, /Previously attempted announcement/);
  assert.match(textCalls[0].body.input, /today or the last 24 hours/);
  assert.doesNotMatch(textCalls[1].body.input, /500-750/);
  assert.equal(textCalls[1].body.max_output_tokens, 7500);
  assert.match(textCalls[2].body.input, /do not flag that required match as copying/);
  assert.deepEqual(calls.filter(({ target }) => target.endsWith("/reserve")).map(({ body }) => body.stage), ["research", "writing", "review", "cover"]);
  assert.equal(calls.filter(({ target }) => target.endsWith("/usage")).length, 4);
  const complete = calls.find(({ target }) => target.endsWith("/complete"));
  assert.equal(complete.body.draft.title, draft.title);
  assert.equal(complete.body.draft.status, undefined);
  assert.equal(calls.some(({ target }) => /publish|admin\/blogs/.test(target)), false);
});

test("wording issues receive at most one separately logged revision and another review", async () => {
  const revised = await mockRun({ revise: true, images: true });
  assert.equal(revised.paidCalls, 6);
  assert.deepEqual(revised.calls.filter(({ target }) => target.endsWith("/reserve")).map(({ body }) => body.stage), ["research", "writing", "review", "revision", "revision_review", "cover"]);
  assert.equal(revised.calls.filter(({ target }) => target.endsWith("/complete")).length, 1);
  const failed = await mockRun({ revise: true, revisionFails: true, images: true });
  assert.equal(failed.paidCalls, 5);
  assert.equal(failed.calls.some(({ target }) => target.endsWith("/complete")), false);
  assert.equal(failed.calls.filter(({ target, body }) => target.endsWith("/reserve") && body.stage === "revision").length, 1);
});

test("budget refusal spends nothing; uncertain provider usage is held and never retried", async () => {
  const denied = await mockRun({ denyReservation: true });
  assert.equal(denied.paidCalls, 0);
  for (const options of [{ providerStatus: 500 }, { withUsage: false }]) {
    const result = await mockRun(options);
    assert.equal(result.paidCalls, 1);
    assert.equal(result.calls.find(({ target }) => target.endsWith("/usage")).body.status, "unknown");
    assert.equal(result.calls.some(({ target }) => target.endsWith("/complete")), false);
    assert.equal(result.calls.filter(({ target }) => target.endsWith("/claim")).length, 1);
  }
  const rejected = await mockRun({ providerStatus: 401 });
  assert.equal(rejected.calls.find(({ target }) => target.endsWith("/usage")).body.status, "rejected");
});
