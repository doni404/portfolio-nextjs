"use client";
import { useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
export function LikeButton({ slug }: { slug: string }) {
  const [count, setCount] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mutation = useRef(0);
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  useEffect(() => {
    let active = true;
    const version = mutation.current;
    fetch(`${base}/api/blogs/${encodeURIComponent(slug)}/likes`).then((res) => { if (!res.ok) throw new Error(); return res.json(); }).then((res) => { if (active && version === mutation.current) { setCount(res.data.count); try { setLiked(localStorage.getItem(`liked:${slug}`) === "true"); } catch {} } }).catch(() => {});
    return () => { active = false; };
  }, [slug, base]);
  async function toggle() {
    setBusy(true); setError("");
    try {
      let visitorId = localStorage.getItem("journal-reader-id");
      if (!visitorId) { visitorId = crypto.randomUUID(); localStorage.setItem("journal-reader-id", visitorId); }
      const res = await fetch(`${base}/api/blogs/${encodeURIComponent(slug)}/likes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visitorId, liked: !liked }) });
      if (!res.ok) throw new Error();
      const result = (await res.json()).data;
      mutation.current++;
      setCount(result.count); setLiked(result.liked); localStorage.setItem(`liked:${slug}`, String(result.liked));
      if (result.liked) trackEvent("like_blog", { content_id: slug });
    } catch { setError("Could not save your like. Please try again."); } finally { setBusy(false); }
  }
  return <div className="reader-like"><button onClick={() => void toggle()} disabled={busy} aria-pressed={liked} title={liked ? "Remove like" : "Like this article"}><Heart size={17} fill={liked ? "currentColor" : "none"} />{liked ? "Liked" : "Useful read?"}{count !== null && <span>{count}</span>}</button>{error && <small role="alert">{error}</small>}</div>;
}
