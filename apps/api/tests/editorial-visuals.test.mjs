import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const require = createRequire(import.meta.url);
const { requiredInlineVisualCount, inlineVisualIssues, renderInlineVisual, installInlineVisuals, inlineVisualSchema } = require("../dist/lib/editorial-visuals.js");
const visual = {
  id: "visual-1", kind: "flow", title: "From a scan to reviewed data",
  summary: "Extraction starts the process; checking the result makes it useful for the next system.",
  items: [
    { label: "Extract", description: "Read the document and return structured candidate fields." },
    { label: "Check", description: "Review uncertain fields against the source document." },
    { label: "Use", description: "Pass approved information to the next business workflow." },
  ],
  alt: "Three stages: extract candidate fields, check them against the document, then use approved information.",
  caption: "Illustrative review process: extracted fields are candidates, not automatically verified facts.",
};
const content = (words) => "word ".repeat(words);

test("inline image quotas follow actual prose length, not padded reading-time metadata", () => {
  for (const [words, count] of [[220, 0], [660, 0], [661, 1], [1320, 1], [1321, 2], [1750, 2]]) assert.equal(requiredInlineVisualCount(content(words)), count);
  assert.equal(requiredInlineVisualCount(`${content(660)}\n\n[[visual-1]]\n\n## Sources\n\n${content(300)}`), 0);
});

test("visual plans need unique inline placements, spacing, descriptions, and the right count", () => {
  const draft = { content: `${content(300)}\n\n[[visual-1]]\n\n${content(500)}`, inlineVisuals: [visual] };
  assert.deepEqual(inlineVisualIssues(draft), []);
  for (const invalid of [
    { ...draft, inlineVisuals: [] },
    { ...draft, content: `${content(800)}\n\n[[visual-1]]` },
    { ...draft, content: `[[visual-1]]\n\n${content(800)}` },
    { ...draft, content: draft.content.replace("[[visual-1]]", "inline [[visual-1]] here") },
    { ...draft, content: `${draft.content}\n\n[[visual-1]]` },
    { ...draft, content: draft.content.replace("visual-1", "visual-7") },
    { ...draft, inlineVisuals: [{ ...visual, id: "visual-2" }] },
    { ...draft, inlineVisuals: [{ ...visual, items: [] }] },
  ]) assert.ok(inlineVisualIssues(invalid).length);
  const pair = { content: `${content(300)}\n\n[[visual-1]]\n\n${content(500)}\n\n[[visual-2]]\n\n${content(600)}`, inlineVisuals: [visual, { ...visual, id: "visual-2", kind: "comparison" }] };
  assert.deepEqual(inlineVisualIssues(pair), []);
  assert.ok(inlineVisualIssues({ ...pair, content: `${content(300)}\n\n[[visual-1]]\n\n[[visual-2]]\n\n${content(1100)}` }).length);
});

test("source-plan renderers provide three bounded layouts and escape every model-written field", () => {
  for (const kind of ["flow", "comparison", "checklist"]) {
    const result = renderInlineVisual({ ...visual, kind, title: '<script>alert("no")</script> & text', alt: '"><image href="https://untrusted.example/"> A descriptive explanation.' });
    assert.equal(result.width, 720);
    assert.ok(result.height > 400 && result.height < 1600);
    assert.match(result.svg, /&lt;script&gt;/);
    assert.doesNotMatch(result.svg, /<script|<image|<foreignObject|<a\b|\sonload="|\shref="/);
    assert.match(result.svg, /<title id="title">/);
    assert.match(result.svg, /<desc id="description">/);
  }
  assert.throws(() => inlineVisualSchema.parse({ ...visual, title: "line\nbreak" }));
  const longest = renderInlineVisual({ ...visual, title: "W".repeat(72), items: Array.from({ length: 4 }, () => ({ label: "W".repeat(40), description: "W".repeat(180) })) });
  assert.ok(longest.height > renderInlineVisual(visual).height);
});

test("safe visuals install as immutable persistent images with captions and accessible links", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "inline-visual-test-"));
  const id = "11111111-1111-4111-8111-111111111111";
  const draft = { content: `${content(300)}\n\n[[visual-1]]\n\n${content(500)}`, inlineVisuals: [{ ...visual, caption: '<img onerror="bad"> is escaped in this explanatory caption.' }] };
  try {
    const result = await installInlineVisuals(draft, id, root);
    assert.equal(result.visuals.length, 1);
    assert.match(result.visuals[0].url, /^\/uploads\/blogs\/generated\/[^/]+\/inline-[a-f0-9]{16}\.svg$/);
    assert.match(result.content, /<figure class="article-visual">/);
    assert.match(result.content, /width="720" height="\d+" loading="lazy" decoding="async"/);
    assert.match(result.content, /<figcaption>&lt;img onerror=/);
    assert.doesNotMatch(result.content, /\[\[visual-|<img onerror/);
    const bytes = await readFile(path.join(root, result.visuals[0].url.slice("/uploads/".length)), "utf8");
    assert.equal(bytes, renderInlineVisual(visual).svg);
    assert.deepEqual(await installInlineVisuals(draft, id, root), result);
    assert.equal((await readdir(path.join(root, "blogs", "generated", id))).length, 1);
    assert.deepEqual(await installInlineVisuals({ content: "Legacy draft" }, id, root), { content: "Legacy draft", visuals: [] });
    await assert.rejects(installInlineVisuals({ ...draft, inlineVisuals: [] }, id, root));
    await assert.rejects(installInlineVisuals(draft, "../../escape", root));
  } finally { await rm(root, { recursive: true, force: true }); }
});
