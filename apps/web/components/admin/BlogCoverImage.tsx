"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff, ImageIcon } from "lucide-react";
import { publicImageUrl } from "@/lib/media";

export function BlogCoverImage({
  src,
  title,
  thumbnail = false,
}: {
  src?: string | null;
  title: string;
  thumbnail?: boolean;
}) {
  const source = publicImageUrl(src);
  const [failedSource, setFailedSource] = useState<string>();
  const unavailable = Boolean(source && failedSource === source);
  const label = unavailable ? "Cover unavailable" : "No cover image";
  const Placeholder = unavailable ? ImageOff : ImageIcon;

  return (
    <div className={thumbnail ? "admin-blog-thumbnail" : "admin-blog-cover"}>
      {source && !unavailable ? (
        <Image
          src={source}
          alt={`Cover image for ${title || "this article"}`}
          fill
          unoptimized
          className="object-contain"
          onError={() => setFailedSource(source)}
        />
      ) : (
        <div className="admin-blog-cover-placeholder" role="img" aria-label={label}>
          <Placeholder aria-hidden="true" className="h-5 w-5" />
          {!thumbnail && <span>{label}</span>}
        </div>
      )}
    </div>
  );
}
