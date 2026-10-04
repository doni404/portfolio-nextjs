import assert from "node:assert/strict";
import { test } from "node:test";
import { GET } from "../app/api/health/route";

test("web health is uncached, independent of the API and identifies the image release", async () => {
  const previous = process.env.APP_REVISION;
  process.env.APP_REVISION = "test-release";
  try {
    const response = GET();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("x-robots-tag"), "noindex");
    assert.deepEqual(await response.json(), { status: "ok", revision: "test-release" });
  } finally {
    if (previous === undefined) delete process.env.APP_REVISION;
    else process.env.APP_REVISION = previous;
  }
});
