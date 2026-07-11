"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

interface Props {
  slug: string;
  title: string;
  category?: string;
}

export function BlogViewAnalytics({ slug, title, category }: Props) {
  useEffect(() => {
    trackEvent("view_blog", {
      content_id: slug,
      content_name: title,
      content_category: category ?? "Article",
    });
  }, [slug, title, category]);

  return null;
}
