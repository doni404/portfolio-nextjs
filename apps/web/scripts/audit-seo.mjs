import assert from "node:assert/strict";
import { Parser } from "htmlparser2";

const base = new URL(process.argv[2] || "http://localhost:3000").origin;
const botHeaders = { "User-Agent": "Twitterbot/1.0" };
const local = ["localhost", "127.0.0.1", "[::1]"].includes(new URL(base).hostname);
const request = (path, options = {}) => fetch(new URL(path, base), {
  headers: botHeaders,
  signal: AbortSignal.timeout(30000),
  ...options,
});

function parse(html) {
  const result = { title: "", h1: 0, meta: {}, links: [], schemas: [], inHead: {} };
  let title = false;
  let head = false;
  let json = null;
  new Parser({
    onopentag(name, attrs) {
      if (name === "head") head = true;
      if (name === "title") title = true;
      if (name === "h1") result.h1++;
      if (name === "meta") {
        const key = attrs.name || attrs.property;
        result.meta[key] = attrs.content;
        if (head) result.inHead[key] = true;
      }
      if (name === "link") result.links.push(attrs);
      if (name === "script" && attrs.type === "application/ld+json") json = "";
    },
    ontext(text) {
      if (title) result.title += text;
      if (json !== null) json += text;
    },
    onclosetag(name) {
      if (name === "title") title = false;
      if (name === "head") head = false;
      if (name === "script" && json !== null) {
        result.schemas.push(JSON.parse(json));
        json = null;
      }
    },
  }, { decodeEntities: true }).end(html);
  return result;
}

function schemaTypes(value) {
  if (Array.isArray(value)) return value.flatMap(schemaTypes);
  if (!value || typeof value !== "object") return [];
  return [value["@type"], ...(value["@graph"] || []).flatMap(schemaTypes)].filter(Boolean);
}

const sitemapResponse = await request("/sitemap.xml");
assert.equal(sitemapResponse.status, 200, "sitemap available");
const sitemap = await sitemapResponse.text();
const urls = [];
let inLocation = false;
let location = "";
new Parser({
  onopentag(name) { if (name === "loc") { inLocation = true; location = ""; } },
  ontext(text) { if (inLocation) location += text; },
  onclosetag(name) { if (name === "loc") { urls.push(location); inLocation = false; } },
}, { xmlMode: true, decodeEntities: true }).end(sitemap);
assert.ok(urls.length >= 6, "public pages in sitemap");
assert.equal(new Set(urls).size, urls.length, "no duplicate sitemap URLs");
const canonicalOrigin = new URL(urls[0]).origin;
const titles = new Set();
const images = new Set();
for (const url of urls) {
  const canonical = new URL(url);
  assert.equal(canonical.origin, canonicalOrigin);
  assert.ok(!canonical.search && !canonical.hash && !canonical.pathname.startsWith("/admin"));
  const response = await request(canonical.pathname);
  assert.equal(response.status, 200, canonical.pathname);
  const page = parse(await response.text());
  assert.equal(page.h1, 1, `${canonical.pathname}: one H1`);
  assert.ok(page.title && !titles.has(page.title), `${canonical.pathname}: unique title`);
  titles.add(page.title);
  assert.ok(page.meta.description?.trim(), "page description");
  const pageCanonical = page.links.find(link => link.rel === "canonical")?.href;
  // Next normalizes the root URL's trailing slash in metadata.
  assert.equal(new URL(pageCanonical).href, canonical.href, "self canonical");
  assert.equal(new URL(page.meta["og:url"]).href, canonical.href);
  assert.equal(page.meta["og:title"], page.title);
  assert.equal(page.meta["twitter:card"], "summary_large_image");
  assert.equal(page.inHead["og:image"], true, "bot metadata in head");
  assert.doesNotMatch(page.meta.robots, /noindex/);
  assert.match(page.meta.googlebot, /max-image-preview:large/);
  assert.ok(page.links.some(link => link.type === "application/rss+xml"), "RSS discovery");
  const types = page.schemas.flatMap(schemaTypes);
  assert.ok(types.includes("WebSite") && types.includes("Person"));
  if (canonical.pathname.startsWith("/blogs/")) assert.ok(types.includes("BlogPosting") && types.includes("BreadcrumbList"));
  if (canonical.pathname.startsWith("/projects/")) assert.ok(types.includes("CreativeWork") && types.includes("BreadcrumbList"));
  if (canonical.pathname === "/about") assert.ok(types.includes("ProfilePage"));
  images.add(page.meta["og:image"]);
  console.log(`PASS ${canonical.pathname}`);
}
for (const image of images) {
  const url = new URL(image);
  if (!local) {
    assert.equal(url.protocol, "https:", "public HTTPS share image");
    assert.ok(!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname), "no local share images");
  }
  const target = local && url.origin === canonicalOrigin ? `${url.pathname}${url.search}` : url.href;
  const response = await request(target, { method: "HEAD" });
  assert.equal(response.status, 200, url.pathname);
  assert.match(response.headers.get("content-type"), /^image\//, url.pathname);
}
const rules = await (await request("/robots.txt")).text();
assert.ok(rules.includes(`Sitemap: ${canonicalOrigin}/sitemap.xml`));
assert.match(rules, /Allow: \/api\/og/);
const login = await request("/admin/login");
assert.equal(login.status, 200);
assert.match(login.headers.get("x-robots-tag"), /noindex/);
assert.match(parse(await login.text()).meta.robots, /noindex/);
const protectedPage = await request("/admin/projects", { redirect: "manual" });
assert.equal(protectedPage.status, 307);
assert.match(protectedPage.headers.get("x-robots-tag"), /noindex/);
const search = await request("/blogs?q=AI");
assert.equal(search.status, 200);
const searchPage = parse(await search.text());
assert.match(searchPage.meta.robots, /noindex/);
assert.match(searchPage.meta.robots, /follow/);
assert.equal(searchPage.links.find(link => link.rel === "canonical")?.href, `${canonicalOrigin}/blogs?q=AI`);
for (const path of ["/blogs/seo-audit-missing", "/projects/seo-audit-missing", "/blogs?page=999999"]) {
  const response = await request(path);
  assert.equal(response.status, 404, path);
  assert.match(await response.text(), /noindex/, path);
}
const rss = await request("/rss.xml");
assert.equal(rss.status, 200);
assert.match(rss.headers.get("content-type"), /application\/rss\+xml/);
assert.match(await rss.text(), /<channel>/);
console.log(`PASS ${urls.length} public pages, ${images.size} share images, crawler rules, admin, search, RSS and 404s`);
