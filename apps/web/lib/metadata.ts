import type { Metadata } from "next";
import { mediaUrl } from "./media";

export function siteOrigin(value?: string) {
  const url = new URL(value?.trim() || "https://doniputra.com");
  if (!/^https?:$/.test(url.protocol) || url.username || url.password)
    throw new Error("NEXT_PUBLIC_SITE_URL must be a public HTTP(S) URL.");
  return url.origin;
}

export const siteConfig = {
  name: "Doni Putra Purbawa",
  shortName: "Doni Putra",
  title: "Doni Putra Purbawa | Cloud Architect & Backend Engineer",
  description:
    "AI insights and technical case studies by Doni Putra Purbawa, a Cloud Architect and Senior Backend Engineer working with AWS, fintech, and AI systems.",
  url: siteOrigin(process.env.NEXT_PUBLIC_SITE_URL),
  creator: "Doni Putra Purbawa",
  email: "doniputrapurbawa@gmail.com",
};

type PageMetadataInput = {
  title?: string;
  description?: string;
  path?: string;
  imageTitle?: string;
  imageDescription?: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
  noIndex?: boolean;
  noFollow?: boolean;
  authorName?: string;
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}

export function ogImageUrl(params: {
  title: string;
  description?: string;
  label?: string;
}) {
  const search = new URLSearchParams({
    title: params.title,
    ...(params.description ? { description: params.description } : {}),
    ...(params.label ? { label: params.label } : {}),
  });

  return absoluteUrl(`/api/og?${search.toString()}`);
}

export function socialImageUrl(image?: string) {
  if (!image) return undefined;
  try {
    const url = new URL(mediaUrl(image)!, siteConfig.url);
    return /^https?:$/.test(url.protocol) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function buildMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  imageTitle = title ?? siteConfig.shortName,
  imageDescription = description,
  image: coverImage,
  type = "website",
  publishedTime,
  modifiedTime,
  tags,
  noIndex = false,
  noFollow = false,
  authorName = siteConfig.name,
}: PageMetadataInput = {}): Metadata {
  const pageTitle = title ? `${title} | ${siteConfig.shortName}` : siteConfig.title;
  const canonical = new URL(absoluteUrl(path));
  canonical.hash = "";
  const url = canonical.toString();
  const suppliedImage = socialImageUrl(coverImage);
  const image = suppliedImage ??
    ogImageUrl({
      title: imageTitle,
      description: imageDescription,
      label: type === "article" ? "The Journal" : "Journal & Portfolio",
    });

  return {
    title: { absolute: pageTitle },
    description,
    alternates: {
      canonical: url,
      types: {
        "application/rss+xml": [
          { url: absoluteUrl("/rss.xml"), title: "Doni Putra's Journal" },
        ],
      },
    },
    openGraph: {
      title: pageTitle,
      description,
      url,
      siteName: siteConfig.name,
      locale: "en_US",
      type,
      images: [
        {
          url: image,
          ...(!suppliedImage ? { width: 1200, height: 630 } : {}),
          alt: imageTitle,
        },
      ],
      ...(type === "article"
        ? {
            publishedTime,
            modifiedTime,
            tags,
            authors: [authorName],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [image],
    },
    robots: {
      index: !noIndex,
      follow: !noFollow,
      ...(!noIndex
        ? {
            googleBot: {
              index: true,
              follow: true,
              "max-image-preview": "large",
              "max-snippet": -1,
              "max-video-preview": -1,
            },
          }
        : {}),
    },
  };
}
