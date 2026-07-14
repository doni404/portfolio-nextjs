import { publicApi } from "@/lib/server-api";
import { absoluteUrl, siteConfig } from "@/lib/metadata";

export const dynamic = "force-dynamic";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatRssDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toUTCString() : date.toUTCString();
}

export async function GET() {
  const response = await publicApi.getBlogs({ pageSize: "50" });
  const posts = response?.data ?? [];
  const feedUrl = absoluteUrl("/rss.xml");

  const items = posts
    .filter((post) => post.status === "published")
    .map((post) => {
      const postUrl = absoluteUrl(`/blogs/${post.slug}`);
      const description = post.seoDescription ?? post.excerpt;

      return `
        <item>
          <title>${escapeXml(post.title)}</title>
          <link>${escapeXml(postUrl)}</link>
          <guid isPermaLink="true">${escapeXml(postUrl)}</guid>
          <description>${escapeXml(description)}</description>
          <pubDate>${formatRssDate(post.publishedAt ?? post.updatedAt)}</pubDate>
          ${post.category ? `<category>${escapeXml(post.category.name)}</category>` : ""}
        </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.title)}</title>
    <link>${escapeXml(siteConfig.url)}</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>en</language>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
