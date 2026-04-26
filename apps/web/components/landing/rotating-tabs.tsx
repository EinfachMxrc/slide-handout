"use client";

import { useEffect, useRef, useState } from "react";

export interface RotatingTab {
  id: string;
  label: string;
  title: string;
  body: string;
  visual: React.ReactNode;
}

interface RotatingTabsProps {
  tabs: RotatingTab[];
  /** Sekunden pro Tab. Air verwendet ~12s. */
  intervalSec?: number;
}

/**
 * Air-style Auto-Rotating-Tabs — drei Inhalte rotieren automatisch alle 12s,
 * mit einem Indicator, der über die Tab-Bar gleitet (translate, 0.6s air-ease).
 * Klick auf einen Tab pausiert die Rotation und springt direkt dorthin.
 *
 * Verbatim Air-Tokens:
 *   - Indicator-Translate: 0.6s cubic-bezier(0.22, 1, 0.36, 1)
 *   - Content-FadeIn: air-fade-in keyframe
 *   - Glow-Pulse: air-glow keyframe (einmal pro Tab-Wechsel)
 */
export function RotatingTabs({
  tabs,
  intervalSec = 12,
}: RotatingTabsProps): React.ReactElement {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const startRef = useRef<number>(performance.now());

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    startRef.current = performance.now();
    const tick = (): void => {
      const elapsed = (performance.now() - startRef.current) / 1000;
      const ratio = Math.min(elapsed / intervalSec, 1);
      setProgress(ratio);
      if (ratio >= 1) {
        setActive((a) => (a + 1) % tabs.length);
        startRef.current = performance.now();
        setProgress(0);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused, intervalSec, tabs.length, active]);

  const select = (i: number): void => {
    setActive(i);
    setProgress(0);
    startRef.current = performance.now();
    setPaused(true);
  };

  const tabCount = tabs.length;
  const activeTab = tabs[active];
  if (!activeTab) {
    throw new Error("RotatingTabs: tabs must be non-empty");
  }

  return (
    <div className="w-full">
      {/* Tab-Bar mit gleitendem Indicator (Air-Pattern: ein einziges
       * absolut positioniertes Element, das via translate animiert). */}
      <div
        role="tablist"
        className="relative mx-auto flex max-w-3xl gap-1 rounded-pill border border-paper-line bg-paper p-1.5"
      >
        <span
          aria-hidden
          className="absolute inset-y-1.5 rounded-pill bg-ink"
          style={{
            width: `calc((100% - 0.75rem) / ${tabCount})`,
            left: "0.375rem",
            translate: `${active * 100}% 0`,
            transition: "translate 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
        {tabs.map((t, i) => {
          const isActive = i === active;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => select(i)}
              className={`relative z-10 flex-1 rounded-pill px-5 py-2.5 text-sm font-medium transition-colors duration-300 ${
                isActive ? "text-paper" : "text-ink-mute hover:text-ink"
              }`}
            >
              {t.label}
              {/* Progress-Strich nur unter dem aktiven Tab */}
              {isActive && !paused && (
                <span
                  aria-hidden
                  className="absolute inset-x-4 -bottom-px h-px overflow-hidden"
                >
                  <span
                    className="block h-full origin-left bg-paper/40"
                    style={{ transform: `scaleX(${progress})` }}
                  />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content — wechselt mit fadeIn-Animation. key forciert Remount,
       * damit die Animation jedesmal von vorne läuft. */}
      <div className="mt-12 grid gap-12 md:grid-cols-12 md:items-center">
        <div
          key={`text-${active}`}
          className="md:col-span-5"
          style={{
            animation: "air-fade-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
          }}
        >
          <h3 className="font-display text-4xl leading-[0.95] tracking-tight sm:text-5xl">
            {activeTab.title}
          </h3>
          <p className="mt-5 text-base leading-relaxed text-ink-mute">
            {activeTab.body}
          </p>
        </div>
        <div
          key={`visual-${active}`}
          className="relative md:col-span-7"
          style={{
            animation: "air-fade-in 0.8s cubic-bezier(0.22, 1, 0.36, 1) both",
          }}
        >
          {/* Glow-Layer hinter dem Visual — Pulse-Animation nur bei Wechsel */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 rounded-card opacity-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(120,180,240,0.45), transparent 70%)",
              animation: "air-glow 2.4s cubic-bezier(0.22, 1, 0.36, 1) both",
            }}
          />
          {activeTab.visual}
        </div>
      </div>
    </div>
  );
}
