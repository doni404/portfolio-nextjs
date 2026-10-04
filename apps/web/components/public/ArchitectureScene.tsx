"use client";

import { useEffect, useRef, useState } from "react";
import { Brain, Cloud, RotateCcw, Server } from "lucide-react";
import type { ArchitectureRenderer, LayerKey } from "./architecture-renderer";

const layers = {
  cloud: {
    icon: Cloud,
    label: "Cloud",
    number: "01",
    title: "The foundation for what comes next.",
    description:
      "AWS infrastructure built for reliability, security, and growth.",
  },
  backend: {
    icon: Server,
    label: "Backend",
    number: "02",
    title: "Where the moving parts come together.",
    description:
      "APIs, data flows, and integrations with clear service boundaries.",
  },
  ai: {
    icon: Brain,
    label: "AI",
    number: "03",
    title: "Intelligence that earns its place.",
    description:
      "Applied AI connected to useful, real-world product experiences.",
  },
};

export function ArchitectureScene() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<ArchitectureRenderer | null>(null);
  const activeRef = useRef<LayerKey>("cloud");
  const [active, setActive] = useState<LayerKey>("cloud");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let cancelled = false;
    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        try {
          const { createArchitectureRenderer } = await import(
            "./architecture-renderer"
          );
          if (cancelled) return;
          renderer.current = createArchitectureRenderer(element, (key) => {
            activeRef.current = key;
            setActive(key);
          });
          renderer.current.select(activeRef.current);
          setReady(true);
        } catch {
          // The static layers remain available when WebGL is unsupported.
        }
      },
      { rootMargin: "150px" },
    );
    observer.observe(element);
    return () => {
      cancelled = true;
      observer.disconnect();
      renderer.current?.dispose();
      renderer.current = null;
    };
  }, []);

  function select(key: LayerKey) {
    activeRef.current = key;
    setActive(key);
    renderer.current?.select(key);
  }

  const current = layers[active];
  return (
    <div className="architecture-scene">
      <div className="scene-viewport">
        <canvas
          ref={canvas}
          aria-label="Three-layer architecture: cloud infrastructure, backend services, and applied AI"
          role="img"
          style={{ opacity: ready ? 1 : 0 }}
        />
        {!ready && (
          <div className="scene-placeholder" aria-hidden="true">
            <div className="scene-placeholder-stack">
              <span>Applied AI</span>
              <span>Backend services</span>
              <span>Cloud infrastructure</span>
            </div>
          </div>
        )}
      </div>
      <div className="scene-toolbar">
        <div
          className="layer-controls"
          role="group"
          aria-label="Architecture layers"
        >
          {(Object.keys(layers) as LayerKey[]).map((key) => {
            const { icon: Icon, label } = layers[key];
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active === key}
                onClick={() => select(key)}
              >
                <Icon size={14} /> {label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="icon-control"
          title="Reset architecture"
          aria-label="Reset architecture"
          onClick={() => {
            renderer.current?.reset();
            select("cloud");
          }}
        >
          <RotateCcw size={15} />
        </button>
      </div>
      <div className="scene-caption" aria-live="polite">
        <span>{current.number}</span>
        <div>
          <h2>{current.title}</h2>
          <p>{current.description}</p>
        </div>
      </div>
    </div>
  );
}
