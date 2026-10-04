"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Copy } from "lucide-react";
import { createRoot } from "react-dom/client";
import type { ArticleHeading } from "@/lib/article-content";

export function ReadingTools({ headings }: { headings: ArticleHeading[] }) {
  const [active, setActive] = useState(headings[0]?.id ?? "");
  const bar = useRef<HTMLDivElement>(null);
  const contents = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const compact = matchMedia("(max-width: 900px)");
    const update = () => {
      if (contents.current) contents.current.open = !compact.matches;
    };
    update();
    compact.addEventListener("change", update);
    return () => compact.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const article = document.getElementById("reading-content");
    if (!article) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = article.getBoundingClientRect();
      const progress = Math.max(
        0,
        Math.min(
          1,
          (140 - rect.top) / Math.max(1, rect.height - innerHeight + 140),
        ),
      );
      if (bar.current) bar.current.style.transform = `scaleX(${progress})`;
      const passed = headings.filter(
        (h) =>
          (document.getElementById(h.id)?.getBoundingClientRect().top ??
            Infinity) <= 170,
      );
      setActive(passed.at(-1)?.id ?? headings[0]?.id ?? "");
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    update();
    const timers: ReturnType<typeof setTimeout>[] = [];
    const buttons = Array.from(article.querySelectorAll("pre")).map((pre) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "code-copy";
      const root = createRoot(button);
      root.render(<Copy size={14} />);
      button.setAttribute("aria-label", "Copy code");
      button.title = "Copy code";
      button.onclick = async () => {
        try {
          await navigator.clipboard.writeText(
            pre.querySelector("code")?.textContent ?? "",
          );
          button.setAttribute("aria-label", "Code copied");
          button.title = "Copied";
          button.dataset.copied = "true";
          root.render(<Check size={14} />);
          timers.push(
            setTimeout(() => {
              delete button.dataset.copied;
              button.title = "Copy code";
              button.setAttribute("aria-label", "Copy code");
              root.render(<Copy size={14} />);
            }, 2000),
          );
        } catch {
          button.title = "Unable to copy. Select the code to copy it.";
        }
      };
      pre.append(button);
      return { button, root };
    });
    return () => {
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      cancelAnimationFrame(frame);
      buttons.forEach(({ button, root }) => {
        queueMicrotask(() => root.unmount());
        button.remove();
      });
      timers.forEach(clearTimeout);
    };
  }, [headings]);
  return (
    <>
      <div className="reading-progress" aria-hidden="true">
        <div ref={bar} />
      </div>
      {headings.length > 0 && (
        <aside className="reading-sidebar">
          <details ref={contents} className="reading-contents" open>
            <summary>
              On this page <ChevronDown size={15} />
            </summary>
            <nav aria-label="Table of contents">
              {headings.map((heading) => (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  aria-current={active === heading.id ? "location" : undefined}
                  className={heading.level === 3 ? "subheading" : ""}
                >
                  {heading.text}
                </a>
              ))}
            </nav>
          </details>
          <a className="reading-back-top" href="#article-top">
            Back to top
          </a>
        </aside>
      )}
    </>
  );
}
