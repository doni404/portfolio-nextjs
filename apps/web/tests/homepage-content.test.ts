import assert from "node:assert/strict";
import { test } from "node:test";
import { getHomepageItems } from "../lib/homepage-content";

type Item = { id: string; featured: boolean };

function contentLoader(items: Item[]) {
  const calls: Record<string, string>[] = [];
  const load = async (params: Record<string, string>) => {
    calls.push(params);
    return {
      data: items
        .filter((item) => params.featured !== "true" || item.featured)
        .slice(0, Number(params.pageSize)),
    };
  };
  return { load, calls };
}

test("older featured blogs and projects appear ahead of the recent page", async () => {
  for (const limit of [3, 4]) {
    const items = Array.from({ length: 8 }, (_, index) => ({
      id: String(index), featured: index >= 6,
    }));
    const { load, calls } = contentLoader(items);
    const result = await getHomepageItems(load, limit);

    assert.deepEqual(result.map((item) => item.id), ["6", "7", "0", "1"].slice(0, limit));
    assert.deepEqual(calls, [
      { featured: "true", pageSize: String(limit) },
      { pageSize: String(limit) },
    ]);
  }
});

test("featured entries are not repeated when also present in recent results", async () => {
  const { load } = contentLoader([
    { id: "new-featured", featured: true },
    { id: "new", featured: false },
    { id: "older", featured: false },
    { id: "old-featured", featured: true },
  ]);
  assert.deepEqual((await getHomepageItems(load, 3)).map((item) => item.id), [
    "new-featured", "old-featured", "new",
  ]);
});

test("a full featured selection does not request unnecessary fallback items", async () => {
  const { load, calls } = contentLoader(
    Array.from({ length: 5 }, (_, index) => ({ id: String(index), featured: true })),
  );
  assert.equal((await getHomepageItems(load, 3)).length, 3);
  assert.deepEqual(calls, [{ featured: "true", pageSize: "3" }]);
});

test("without featured selections, the homepage keeps the recent order", async () => {
  const { load } = contentLoader([
    { id: "new", featured: false },
    { id: "old", featured: false },
  ]);
  assert.deepEqual((await getHomepageItems(load, 4)).map((item) => item.id), ["new", "old"]);
});

test("changing featured selections is reflected on the next homepage request", async () => {
  const items = [
    { id: "recent", featured: false },
    { id: "original-pick", featured: true },
    { id: "new-pick", featured: false },
  ];
  const { load } = contentLoader(items);
  assert.equal((await getHomepageItems(load, 3))[0].id, "original-pick");
  items[1].featured = false;
  items[2].featured = true;
  assert.equal((await getHomepageItems(load, 3))[0].id, "new-pick");
});

test("API failures keep available content or the existing empty state", async () => {
  assert.deepEqual(await getHomepageItems(async () => null, 4), []);
  const pick = { id: "pick", featured: true };
  assert.deepEqual(await getHomepageItems(async (params) => params.featured ? { data: [pick] } : null, 3), [pick]);
  assert.deepEqual(await getHomepageItems(async (params) => params.featured ? null : { data: [pick] }, 3), [pick]);
});
