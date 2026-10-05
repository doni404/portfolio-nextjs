import { z } from "zod";
import models from "./editorial-models.json";

export const TEXT_MODEL = models.textModel;
export const IMAGE_MODEL = models.imageModel;
// Standard API rates verified 2026-10-05. Estimates are not provider invoices.
export const PRICING = models.pricing;
export const STAGES = { research: 0.25, writing: 0.15, review: 0.15, revision: 0.15, revision_review: 0.15, cover: 0.20 } as const;
export const stageSchema = z.enum(["research", "writing", "review", "revision", "revision_review", "cover"]);
export const runAtSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const coverDirectionSchema = z.object({
  pattern: z.enum(["smooth-light", "bold-dark"]),
  reason: z.string().min(20).max(400),
  headline: z.string().min(3).max(70),
  brand: z.string().min(2).max(60).nullable(),
  person: z.string().min(3).max(80).nullable(),
  portrait: z.enum(["none", "illustrated"]),
}).refine((value) => Boolean(value.person) === (value.portrait === "illustrated"), "A portrait must identify its subject");
export const storyDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((date) => {
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}, "Invalid calendar date");
export const blogCoverSchema = z.string().refine((value) => {
  if (!value) return true;
  if (/^\/(?:uploads\/blogs|images)\/[a-zA-Z0-9/_-]+\.(?:png|jpe?g|webp|gif|avif)$/i.test(value)) return true;
  try { return ["https:", "http:"].includes(new URL(value).protocol); } catch { return false; }
}, "Use an HTTP image URL or a safe /uploads/blogs/ image path");
export function requiresEditorialReview(metadata: unknown, previousStatus: string, nextStatus?: string) {
  return Boolean(metadata && typeof metadata === "object" && "aiAssisted" in metadata && metadata.aiAssisted === true && previousStatus !== "published" && nextStatus === "published");
}
export const sourceSchema = z.object({ title: z.string().min(3).max(200), url: z.string().url().refine((url) => new URL(url).protocol === "https:"), date: storyDateSchema });
export const draftSchema = z.object({
  title: z.string().min(10).max(180), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(200),
  excerpt: z.string().min(40).max(320), content: z.string().min(1200).max(18000),
  storyDate: storyDateSchema,
  beat: z.enum(["industry", "policy", "work", "products", "research", "engineering", "models", "japan", "custom"]),
  newsworthiness: z.string().min(30).max(600),
  format: z.enum(["explainer", "briefing", "paper-breakdown", "practical-guide", "comparison"]),
  sources: z.array(sourceSchema).min(2).max(8).refine((sources) => new Set(sources.map((source) => source.url)).size === sources.length, "Sources must be distinct"),
  coverPrompt: z.string().min(30).max(1800),
  coverArtDirection: coverDirectionSchema.optional(),
  flow: z.array(z.object({ title: z.string().min(2).max(60), description: z.string().min(10).max(240) })).max(6),
});

export function monthRange(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error("Invalid month");
  const start = new Date(`${month}-01T00:00:00Z`);
  const end = new Date(start); end.setUTCMonth(end.getUTCMonth() + 1);
  return { start, end };
}
export function jakartaDay(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
export function scheduleDue(runAt: string, now = new Date()) {
  runAtSchema.parse(runAt);
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now);
  return time >= runAt;
}
export function costEstimate(stage: string, usage: { input: number; cached: number; output: number; search: number; imageInput: number; imageText: number }, pricing = PRICING) {
  return stage === "cover"
    ? (usage.imageText * pricing.imageText + usage.imageInput * pricing.imageInput + usage.output * pricing.imageOutput) / 1e6
    : ((usage.input - usage.cached) * pricing.input + usage.cached * pricing.cached + usage.output * pricing.output) / 1e6 + usage.search * pricing.search;
}
export function budgetAllows(budget: number, committed: number, reservation: number) {
  return budget > 0 && committed + reservation <= budget + 0.0000001;
}
