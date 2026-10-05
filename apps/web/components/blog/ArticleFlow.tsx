"use client";
import { useEffect, useState } from "react";
import { Play, Pause, ArrowRight } from "lucide-react";
export function ArticleFlow({ steps }: { steps: { title: string; description: string }[] }) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stop = () => { if (reduced.matches) setPlaying(false); };
    reduced.addEventListener("change", stop);
    const timer = setInterval(() => { if (!document.hidden && !reduced.matches) setActive((step) => (step + 1) % steps.length); }, 2400);
    return () => { clearInterval(timer); reduced.removeEventListener("change", stop); };
  }, [playing, steps.length]);
  if (steps.length < 2) return null;
  return <section className="article-flow" aria-label="Illustrative workflow"><div><h2>How it fits together</h2><button title={playing ? "Pause flow" : "Play flow"} aria-label={playing ? "Pause flow" : "Play flow"} onClick={() => { if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying((value) => !value); }}>{playing ? <Pause size={17} /> : <Play size={17} />}</button></div><ol>{steps.map((step, index) => <li key={index} data-active={active === index}><button aria-pressed={active === index} onClick={() => { setActive(index); setPlaying(false); }}><span>{String(index + 1).padStart(2, "0")}</span><strong>{step.title}</strong><p>{step.description}</p>{index < steps.length - 1 && <ArrowRight size={15} />}</button></li>)}</ol><small>Illustrative workflow, not a vendor architecture diagram.</small></section>;
}
