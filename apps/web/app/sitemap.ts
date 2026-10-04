import type { MetadataRoute } from "next";
import { publicApi } from "@/lib/server-api";
import { allSitemapItems, contentSitemap } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await allSitemapItems(publicApi.getBlogs);
  const projects = await allSitemapItems(publicApi.getProjects);
  return contentSitemap(posts, projects);
}
