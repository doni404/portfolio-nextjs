import type { Metadata } from "next";

export const siteConfig = {
  name: "Doni Putra Purbawa",
  shortName: "Doni Putra",
  title: "Doni Putra Purbawa - Senior Backend Engineer",
  description:
    "Senior Backend Engineer specializing in fintech, cloud infrastructure, microservices, and AI-powered systems. Based in Indonesia, open to Japan opportunities.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://doniputra.com",
  creator: "Doni Putra Purbawa",
  email: "doniputrapurbawa@gmail.com",
};

type PageMetadataInput = {
  title?: string;
  description?: string;
  path?: string;
  imageTitle?: string;
  imageDescription?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
  noIndex?: boolean;
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

export function buildMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  imageTitle = title ?? siteConfig.shortName,
  imageDescription = description,
  type = "website",
  publishedTime,
  modifiedTime,
  tags,
  noIndex = false,
}: PageMetadataInput = {}): Metadata {
  const pageTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.title;
  const url = absoluteUrl(path);
  const image = ogImageUrl({
    title: imageTitle,
    description: imageDescription,
    label: type === "article" ? "Technical Article" : "Portfolio",
  });

  return {
    title: title ?? siteConfig.title,
    description,
    alternates: {
      canonical: url,
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
          width: 1200,
          height: 630,
          alt: imageTitle,
        },
      ],
      ...(type === "article"
        ? {
            publishedTime,
            modifiedTime,
            tags,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [image],
      creator: "@doni404",
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
  };
}
