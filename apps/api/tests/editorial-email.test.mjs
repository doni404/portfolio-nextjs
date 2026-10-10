import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { emailConfiguration, reviewEmail, sendEditorialEmail, emailFailureMessage } = require("../dist/lib/editorial-email.js");
const env = { EDITORIAL_EMAIL_PROVIDER: "ses", SES_REGION: "ap-southeast-1", EDITORIAL_EMAIL_FROM: "Doni Putra Journal <info@doniputra.com>", EDITORIAL_EMAIL_REPLY_TO: "editor@example.com", FRONTEND_URL: "https://doniputra.com", NODE_ENV: "production" };
const email = reviewEmail("reader@example.com", "draft-id", { title: '<script>bad()</script> & "News"', excerpt: "A clear summary." }, "test-key", env);

test("SES config is explicit, runtime-only and does not expose credentials", () => {
  assert.equal(emailConfiguration(env).provider, "ses");
  assert.equal(emailConfiguration({ ...env, SES_REGION: "" }), null);
  assert.equal(emailConfiguration({ ...env, EDITORIAL_EMAIL_PROVIDER: "smtp" }), null);
  assert.equal(emailConfiguration({ ...env, EDITORIAL_EMAIL_FROM: "info@doniputra.com\nBcc: other@example.com" }), null);
  assert.equal(emailConfiguration({ ...env, EDITORIAL_EMAIL_REPLY_TO: "bad" }), null);
  assert.doesNotMatch(JSON.stringify(emailConfiguration({ ...env, AWS_SECRET_ACCESS_KEY: "sensitive-key" })), /sensitive-key/);
  assert.equal(emailConfiguration({ RESEND_API_KEY: "legacy-key", EDITORIAL_EMAIL_FROM: "info@doniputra.com" }).provider, "resend");
});
test("review emails escape article HTML and use a secure admin link without credentials", () => {
  assert.doesNotMatch(email.html, /<script>/);
  assert.match(email.html, /&lt;script&gt;/);
  assert.match(email.text, /https:\/\/doniputra.com\/admin\/blogs\/draft-id/);
  assert.match(email.text, /not published/);
  assert.match(reviewEmail("reader@example.com", null, undefined, "test", env).text, /No article was generated/);
  assert.throws(() => reviewEmail("reader@example.com", null, undefined, "test", { ...env, FRONTEND_URL: "http://doniputra.com" }));
  assert.throws(() => reviewEmail("reader@example.com", null, undefined, "test", { ...env, FRONTEND_URL: "javascript:bad" }));
});
test("SES sends one multipart email to the saved recipient with Reply-To", async () => {
  const calls = [];
  const result = await sendEditorialEmail(email, { env, sesSend: async (input) => { calls.push(input); return { MessageId: "test" }; } });
  assert.equal(result.status, "sent");
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].Destination.ToAddresses, ["reader@example.com"]);
  assert.deepEqual(calls[0].ReplyToAddresses, ["editor@example.com"]);
  assert.equal(calls[0].Content.Simple.Body.Html.Data, email.html);
  assert.equal(calls[0].Content.Simple.Body.Text.Charset, "UTF-8");
});
test("SES failures have safe diagnostics and ambiguous sends are never automatically retried", async () => {
  for (const [name, status, code] of [["AccessDeniedException", "failed", "SES_ACCESS_DENIED"], ["MessageRejected", "failed", "SES_IDENTITY_UNVERIFIED"], ["CredentialsProviderError", "failed", "SES_CREDENTIALS_MISSING"], ["AbortError", "unknown", "EMAIL_UNCERTAIN"]]) {
    let calls = 0;
    const result = await sendEditorialEmail(email, { env, sesSend: async () => { calls++; throw Object.assign(new Error("sensitive-provider-response"), { name }); } });
    assert.deepEqual(result, { status, code });
    assert.equal(calls, 1);
    assert.doesNotMatch(JSON.stringify(result), /sensitive-provider/);
    assert.ok(emailFailureMessage(code));
  }
});
test("unconfigured/invalid mail never sends, and Resend remains available", async () => {
  const noSend = async () => { throw new Error("Must not send"); };
  assert.equal((await sendEditorialEmail(email, { env: {}, sesSend: noSend })).status, "not_configured");
  assert.equal((await sendEditorialEmail({ ...email, to: "bad" }, { env, sesSend: noSend })).status, "failed");
  const result = await sendEditorialEmail(email, { env: { ...env, EDITORIAL_EMAIL_PROVIDER: "resend", RESEND_API_KEY: "fake-key" }, fetchImpl: async (url, options) => {
    assert.equal(url, "https://api.resend.com/emails");
    const body = JSON.parse(options.body);
    assert.equal(body.reply_to, "editor@example.com");
    assert.equal(body.html, email.html);
    assert.equal(options.headers["Idempotency-Key"], "test-key");
    return new Response("{}", { status: 200 });
  } });
  assert.equal(result.status, "sent");
});
