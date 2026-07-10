"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  text?: string;
  className?: string;
}

export function ShareButton({ title, text, className }: Props) {
  const [status, setStatus] = useState<"idle" | "copied" | "shared">("idle");

  function shouldUseNativeShare() {
    if (!navigator.share) return false;
    return window.matchMedia("(pointer: coarse), (max-width: 767px)").matches;
  }

  async function handleShare() {
    const url = window.location.href;

    if (shouldUseNativeShare()) {
      try {
        await navigator.share({ title, text, url });
        setStatus("shared");
        setTimeout(() => setStatus("idle"), 2000);
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium text-slate-500 transition-colors hover:text-slate-800",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        className
      )}
      aria-label="Share this article"
    >
      {status === "copied" ? (
        <>
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-green-600">Link copied</span>
        </>
      ) : status === "shared" ? (
        <>
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-green-600">Shared</span>
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          Share
        </>
      )}
    </button>
  );
}
