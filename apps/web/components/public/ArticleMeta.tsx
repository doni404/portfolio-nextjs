import { Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { BlogPost } from "@/lib/server-api";

export function ArticleMeta({ post }: { post: BlogPost }) {
  return (
    <div className="article-meta">
      {post.publishedAt && (
        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
      )}
      <span>
        <Clock size={14} /> {post.readingTimeMinutes} min read
      </span>
    </div>
  );
}
