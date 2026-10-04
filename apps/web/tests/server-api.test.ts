import assert from "node:assert/strict";
import { test } from "node:test";
import { publicApi } from "../lib/server-api";

test("detail fetches distinguish missing content from temporary API failures", async () => {
  const previous = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response("Not found", { status: 404 });
    assert.equal(await publicApi.getBlog("missing"), null);
    assert.equal(await publicApi.getProject("missing"), null);
    for (const status of [429, 500, 503]) {
      globalThis.fetch = async () => new Response("Unavailable", { status });
      await assert.rejects(publicApi.getBlog("published"), /unavailable/);
      await assert.rejects(publicApi.getProject("published"), /unavailable/);
    }
    globalThis.fetch = async () => { throw new Error("Connection refused"); };
    await assert.rejects(publicApi.getBlog("published"), /Connection refused/);
    await assert.rejects(publicApi.getProject("published"), /Connection refused/);
  } finally {
    globalThis.fetch = previous;
  }
});
