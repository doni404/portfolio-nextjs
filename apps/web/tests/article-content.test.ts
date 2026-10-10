import assert from "node:assert/strict";
import { test } from "node:test";
import { articleContent } from "../lib/article-content";
import { mediaUrl } from "../lib/media";

test("Markdown headings receive stable unique anchors and readable TOC labels", () => {
  const result = articleContent(
    "## Start **here**\n\nText.\n\n### Details\n\n## Start here",
    "case",
  );
  assert.deepEqual(result.headings, [
    { id: "case-1", text: "Start here", level: 2 },
    { id: "case-2", text: "Details", level: 3 },
    { id: "case-3", text: "Start here", level: 2 },
  ]);
  assert.match(result.html, /<strong>here<\/strong>/);
});

test("rich editor HTML remains readable and unsafe content is removed", () => {
  const result = articleContent(
    '<h2 id="old">Cloud &amp; <em>AI</em></h2><script>alert(1)</script><p onclick="alert(1)">Safe <a href="javascript:alert(1)">link</a></p><img src="javascript:alert(1)" onerror="alert(1)">',
  );
  assert.equal(result.headings[0].text, "Cloud & AI");
  assert.doesNotMatch(result.html, /script|onclick|onerror|javascript:/);
  assert.match(result.html, /<p>Safe/);
});

test("code blocks and tables survive formatting", () => {
  const result = articleContent(
    "```go\nctx := context.Background()\n```\n\n| Key | Value |\n| --- | --- |\n| timeout | 2s |",
  );
  assert.match(result.html, /class="language-go"/);
  assert.match(result.html, /<table>/);
  assert.match(result.html, /<td>timeout<\/td>/);
});

test("portable upload paths resolve to the public API without duplicate slashes", () => {
  const previous = process.env.NEXT_PUBLIC_API_URL;
  process.env.NEXT_PUBLIC_API_URL = "https://api.example.com/";
  try {
    assert.equal(
      mediaUrl("/uploads/projects/example/cover.webp"),
      "https://api.example.com/uploads/projects/example/cover.webp",
    );
    assert.equal(mediaUrl("/brand/logo.png"), "/brand/logo.png");
    assert.equal(mediaUrl(undefined), undefined);
    const result = articleContent(
      "![Cover](/uploads/blogs/example/cover.webp)",
    );
    assert.match(
      result.html,
      /src="https:\/\/api.example.com\/uploads\/blogs\/example\/cover.webp"/,
    );
    assert.match(result.html, /loading="lazy"/);
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = previous;
  }
});

test("inline explanatory figures preserve captions, dimensions and full-size API links safely", () => {
  const previous = process.env.NEXT_PUBLIC_API_URL;
  process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
  try {
    const path = "/uploads/blogs/generated/job/inline-123.svg";
    const result = articleContent(`<figure class="article-visual unwanted" onclick="bad()"><a href="${path}" target="_blank"><img src="${path}" alt="A three-stage document review process" width="720" height="820" onerror="bad()"></a><figcaption>Review uncertain fields before using them.</figcaption></figure>`);
    assert.match(result.html, /<figure class="article-visual">/);
    assert.match(result.html, /href="https:\/\/api.example.com\/uploads\/blogs\/generated\/job\/inline-123.svg"/);
    assert.match(result.html, /width="720" height="820" loading="lazy" decoding="async"/);
    assert.match(result.html, /<figcaption>Review uncertain fields before using them\.<\/figcaption>/);
    assert.doesNotMatch(result.html, /onclick|onerror|unwanted/);
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = previous;
  }
});
