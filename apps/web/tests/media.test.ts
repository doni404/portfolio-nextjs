import assert from "node:assert/strict";
import { test } from "node:test";
import { publicImageUrl } from "../lib/media";

test("cover previews resolve upload paths to the public API without changing external images", () => {
  const previous = process.env.NEXT_PUBLIC_API_URL;
  try {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
    assert.equal(publicImageUrl(" /uploads/blogs/generated/cover.webp "), "https://api.example.com/uploads/blogs/generated/cover.webp");
    assert.equal(publicImageUrl("http://localhost:4000/uploads/blogs/cover.webp"), "https://api.example.com/uploads/blogs/cover.webp");
    assert.equal(publicImageUrl("https://cdn.example.com/cover.webp?v=2"), "https://cdn.example.com/cover.webp?v=2");
    assert.equal(publicImageUrl("/profile.png"), "/profile.png");
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = previous;
  }
});

test("missing or unsafe cover URLs cannot become full-size image links", () => {
  for (const value of [undefined, null, "", "  ", "javascript:alert(1)", "data:text/html,test", "//external.example.com/cover.webp", "not-a-url"])
    assert.equal(publicImageUrl(value), undefined);
});
