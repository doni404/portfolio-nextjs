import { SESv2Client, SendEmailCommand, type SendEmailCommandInput } from "@aws-sdk/client-sesv2";
import { z } from "zod";

type Env = NodeJS.ProcessEnv;
type Email = { to: string; subject: string; text: string; html: string; idempotencyKey: string };
type Result = { status: "sent" | "failed" | "unknown" | "not_configured"; code?: string };
const address = z.string().email();
function sender(value?: string) {
  if (!value || /[\r\n]/.test(value)) return false;
  return address.safeParse(value.match(/^[^<>]+<([^<>]+)>$/)?.[1] ?? value).success;
}
export function emailConfiguration(env: Env = process.env) {
  const provider = env.EDITORIAL_EMAIL_PROVIDER || (env.RESEND_API_KEY ? "resend" : "");
  const from = env.EDITORIAL_EMAIL_FROM;
  const replyTo = env.EDITORIAL_EMAIL_REPLY_TO;
  if (!sender(from) || (replyTo && !address.safeParse(replyTo).success)) return null;
  if (provider === "resend" && env.RESEND_API_KEY) return { provider, from: from!, replyTo, region: undefined };
  const region = env.SES_REGION || env.AWS_REGION;
  if (provider === "ses" && region && /^[a-z]{2}(?:-[a-z]+)+-\d$/.test(region)) return { provider, from: from!, replyTo, region };
  return null;
}
const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));
export function reviewEmail(to: string, blogId: string | null, post?: { title: string; excerpt?: string | null }, idempotencyKey = "editorial-test", env: Env = process.env): Email {
  const base = new URL(env.FRONTEND_URL ?? "http://localhost:3000");
  if (base.protocol !== "https:" && !(env.NODE_ENV !== "production" && base.protocol === "http:" && ["localhost", "127.0.0.1"].includes(base.hostname))) throw new Error("EMAIL_REVIEW_URL_INVALID");
  const url = new URL(blogId ? `/admin/blogs/${encodeURIComponent(blogId)}` : "/admin/automation", base).href;
  const title = post?.title ?? "Your journal email connection is working";
  const excerpt = post?.excerpt?.slice(0, 600) ?? "This is a test notification from your journal dashboard.";
  const note = blogId ? "This draft is not published. Review its facts, sources, and cover before publishing." : "No article was generated or published by this email test.";
  return { to, idempotencyKey, subject: blogId ? "Journal draft ready for review" : "Journal notification test",
    text: `${title}\n\n${excerpt}\n\n${note}\n\nOpen your dashboard: ${url}`,
    html: `<div style="font-family:Arial,sans-serif;color:#21382d;max-width:600px;margin:auto;padding:32px"><p style="color:#1d7658">DONI PUTRA JOURNAL</p><h1 style="font-size:24px;line-height:1.4">${escape(title)}</h1><p style="line-height:1.7">${escape(excerpt)}</p><p style="line-height:1.7">${note}</p><p><a href="${escape(url)}" style="display:inline-block;background:#1d7658;color:white;padding:12px 20px;text-decoration:none;border-radius:4px">${blogId ? "Review draft" : "Open dashboard"}</a></p></div>` };
}
export function emailFailureMessage(code?: string) {
  if (code === "SES_ACCESS_DENIED") return "SES permission denied. Check the API's runtime IAM credentials and ses:SendEmail permission.";
  if (code === "SES_IDENTITY_UNVERIFIED") return "SES rejected the identity. Verify the sender domain and, in sandbox mode, the recipient in the same region.";
  if (code === "SES_ACCOUNT_PAUSED") return "SES sending is paused or suspended. Check the SES account dashboard.";
  if (code === "SES_CREDENTIALS_MISSING") return "SES credentials could not be loaded. Configure runtime AWS credentials or a working instance role.";
  if (code === "EMAIL_UNCERTAIN") return "Email delivery is uncertain. Check your inbox/provider before retrying; the request was not automatically retried.";
  return "Email was not sent. Check the provider's runtime configuration and verified identities.";
}
export async function sendEditorialEmail(email: Email, { env = process.env, fetchImpl = fetch, sesSend }: { env?: Env; fetchImpl?: typeof fetch; sesSend?: (input: SendEmailCommandInput) => Promise<unknown> } = {}): Promise<Result> {
  const config = emailConfiguration(env);
  if (!config) return { status: "not_configured" };
  if (!address.safeParse(email.to).success || /[\r\n]/.test(email.subject)) return { status: "failed", code: "EMAIL_INVALID" };
  if (config.provider === "ses") {
    const input: SendEmailCommandInput = { FromEmailAddress: config.from, Destination: { ToAddresses: [email.to] }, ...(config.replyTo ? { ReplyToAddresses: [config.replyTo] } : {}), Content: { Simple: { Subject: { Data: email.subject, Charset: "UTF-8" }, Body: { Text: { Data: email.text, Charset: "UTF-8" }, Html: { Data: email.html, Charset: "UTF-8" } } } } };
    const client = sesSend ? null : new SESv2Client({ region: config.region, maxAttempts: 1 });
    try {
      // SES has no send idempotency key: never automatically repeat an ambiguous send.
      if (sesSend) await sesSend(input);
      else await client!.send(new SendEmailCommand(input), { abortSignal: AbortSignal.timeout(15_000) });
      return { status: "sent" };
    } catch (error) {
      const name = (error as { name?: string }).name;
      const code = name === "AccessDeniedException" ? "SES_ACCESS_DENIED" : name === "MessageRejected" ? "SES_IDENTITY_UNVERIFIED" : ["SendingPausedException", "AccountSuspendedException"].includes(name ?? "") ? "SES_ACCOUNT_PAUSED" : name === "CredentialsProviderError" ? "SES_CREDENTIALS_MISSING" : null;
      const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      return code || (status && status >= 400 && status < 500) ? { status: "failed", code: code ?? "EMAIL_REJECTED" } : { status: "unknown", code: "EMAIL_UNCERTAIN" };
    } finally { client?.destroy(); }
  }
  try {
    const response = await fetchImpl("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": email.idempotencyKey }, body: JSON.stringify({ from: config.from, to: [email.to], ...(config.replyTo ? { reply_to: config.replyTo } : {}), subject: email.subject, text: email.text, html: email.html }), signal: AbortSignal.timeout(15_000) });
    return response.ok ? { status: "sent" } : response.status < 500 ? { status: "failed", code: "EMAIL_REJECTED" } : { status: "unknown", code: "EMAIL_UNCERTAIN" };
  } catch { return { status: "unknown", code: "EMAIL_UNCERTAIN" }; }
}
