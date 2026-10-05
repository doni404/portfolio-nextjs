import jwt from "jsonwebtoken";
import { readFile } from "node:fs/promises";

export function ga4Configured() {
  return Boolean(process.env.GA4_PROPERTY_ID && (process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS));
}
export async function serviceAccount() {
  try {
    const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || await readFile(process.env.GOOGLE_APPLICATION_CREDENTIALS ?? "", "utf8");
    const key = JSON.parse(json);
    if (typeof key.client_email !== "string" || typeof key.private_key !== "string" || !key.client_email || !key.private_key) throw new Error();
    return key as { client_email: string; private_key: string };
  } catch { throw new Error("GA4 credentials are missing, unreadable, or invalid"); }
}

type GAReport = { rows?: { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }[]; metadata?: { subjectToThresholding?: boolean } };
let tokenCache: { token: string; until: number } | undefined;
const reportCache = new Map<number, { until: number; data: unknown }>();
async function accessToken() {
  if (tokenCache && tokenCache.until > Date.now()) return tokenCache.token;
  const key = await serviceAccount();
  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign({ iss: key.client_email, scope: "https://www.googleapis.com/auth/analytics.readonly", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }, key.private_key, { algorithm: "RS256" });
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }), signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error("GA4 authentication failed");
  const data = await response.json() as { access_token: string; expires_in: number };
  tokenCache = { token: data.access_token, until: Date.now() + (data.expires_in - 60) * 1000 };
  return data.access_token;
}
async function report(days: number, dimensions: string[], metrics: string[], filter?: unknown, orderBy?: string): Promise<GAReport> {
  const property = process.env.GA4_PROPERTY_ID;
  if (!property || !/^\d+$/.test(property)) throw new Error("Numeric GA4 Property ID required");
  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${property}:runReport`, { method: "POST", headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" }, body: JSON.stringify({ dateRanges: [{ startDate: `${days}daysAgo`, endDate: "yesterday" }], dimensions: dimensions.map((name) => ({ name })), metrics: metrics.map((name) => ({ name })), ...(filter ? { dimensionFilter: filter } : {}), ...(orderBy ? { orderBys: [{ metric: { metricName: orderBy }, desc: true }] } : {}), limit: 20 }), signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error("GA4 reporting unavailable: check property access and API enablement");
  return response.json() as Promise<GAReport>;
}
export function gaRows(report: GAReport) {
  return (report.rows ?? []).map((row) => ({ dimensions: (row.dimensionValues ?? []).map((d) => d.value), metrics: (row.metricValues ?? []).map((m) => Number(m.value)) }));
}
export async function analyticsReport(days: number) {
  if (!ga4Configured()) return { connected: false, message: "Connect your GA4 property to see real visitor data." };
  const cached = reportCache.get(days);
  if (cached && cached.until > Date.now()) return cached.data;
  const publicPages = { notExpression: { filter: { fieldName: "pagePath", stringFilter: { matchType: "BEGINS_WITH", value: "/admin" } } } };
  const summary = await report(days, [], ["activeUsers", "sessions", "screenPageViews", "engagementRate", "averageSessionDuration"], publicPages);
  const pages = await report(days, ["pagePath", "pageTitle"], ["screenPageViews", "activeUsers", "userEngagementDuration"], { filter: { fieldName: "pagePath", stringFilter: { matchType: "BEGINS_WITH", value: "/blogs/" } } }, "screenPageViews");
  const entries = await report(days, ["landingPage"], ["sessions", "activeUsers"], { notExpression: { filter: { fieldName: "landingPage", stringFilter: { matchType: "BEGINS_WITH", value: "/admin" } } } }, "sessions");
  const sources = await report(days, ["sessionSourceMedium"], ["sessions"], publicPages, "sessions");
  const events = await report(days, ["eventName"], ["eventCount"], { andGroup: { expressions: [publicPages, { filter: { fieldName: "eventName", inListFilter: { values: ["share", "like_blog", "view_blog"] } } }] } });
  const data = { connected: true, days, updatedAt: new Date().toISOString(), summary: gaRows(summary)[0]?.metrics ?? [0, 0, 0, 0, 0], pages: gaRows(pages), entries: gaRows(entries), sources: gaRows(sources), events: gaRows(events), thresholded: [summary, pages, entries, sources, events].some((r) => r.metadata?.subjectToThresholding) };
  reportCache.set(days, { until: Date.now() + 5 * 60_000, data });
  return data;
}
