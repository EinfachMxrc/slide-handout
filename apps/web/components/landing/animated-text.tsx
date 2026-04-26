"use client";

import { useEffect, useRef } from "react";

interface AnimatedTextProps {
  /**
   * Die Zeilen, die nacheinander enthüllt werden. Jeder Eintrag wird in
   * einer eigenen visuellen Zeile mit eigenem `--progress` Scroll-Fortschritt
   * gerendert.
   */
  lines: readonly React.ReactNode[];
  /** Optional zusätzliche a11y-Beschriftung. Fällt sonst auf `lines.join(" ")`. */
  ariaLabel?: string;
  /** Semantisches Heading-Tag (default `h2`). */
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "div";
  className?: string;
  /**
   * Wann (in Viewport-Anteilen vom oberen Rand) die Zeile startet.
   * 0.85 = Zeile beginnt zu erscheinen, sobald sie 85% Viewport-Höhe überschritten hat.
   */
  startAt?: number;
  /** Wann (in Viewport-Anteilen vom oberen Rand) die Zeile vollständig enthüllt ist. */
  endAt?: number;
}

/**
 * AnimatedText — Zeilen-Kaskade-Reveal nach dem air.inc-Muster.
 *
 * Jede Zeile bekommt eine eigene CSS-Variable `--progress` (0 → 1), die aus
 * der Scroll-Position der Zeile gegen den Viewport berechnet wird. Zwei
 * synchrone Effekte greifen ineinander:
 *
 *   1. `mask-image: linear-gradient(transparent ..., black ...)` wischt
 *      den Text von unten nach oben in die Sichtbarkeit.
 *   2. `transform: translateY(calc(100% - progress * 100%))` lässt den
 *      Text gleichzeitig von unten nach oben aufsteigen.
 *
 * Die Kombination erzeugt einen weichen „steigt hoch und enthüllt sich"-
 * Look, ohne Layout-Shift.
 *
 * Performance: einmaliger rAF-Loop, aber nur aktiv, solange die Komponente
 * mindestens teilweise sichtbar ist (via IntersectionObserver gesteuert).
 */
export function AnimatedText({
  lines,
  ariaLabel,
  as = "h2",
  className,
  startAt = 0.85,
  endAt = 0.45,
}: AnimatedTextProps): React.ReactElement {
  const Tag = as;
  const rootRef = useRef<HTMLElement | null>(null);
  const lineRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      for (const line of lineRefs.current) {
        line?.style.setProperty("--progress", "1");
      }
      return;
    }

    let raf = 0;
    let active = false;

    const tick = (): void => {
      const vh = window.innerHeight;
      const span = startAt - endAt;
      for (const line of lineRefs.current) {
        if (!line) continue;
        const rect = line.getBoundingClientRect();
        // Position der Zeil-Oberkante im Viewport, normiert 0..1.
        const norm = rect.top / vh;
        const raw = (startAt - norm) / span;
        const clamped = raw < 0 ? 0 : raw > 1 ? 1 : raw;
        line.style.setProperty("--progress", String(clamped));
      }
      if (active) {
        raf = requestAnimationFrame(tick);
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !active) {
            active = true;
            raf = requestAnimationFrame(tick);
          } else if (!entry.isIntersecting && active) {
            active = false;
            cancelAnimationFrame(raf);
          }
        }
      },
      { rootMargin: "100px 0px 100px 0px" },
    );
    io.observe(root);

    return () => {
      active = false;
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [startAt, endAt, lines.length]);

  return (
    <Tag
      ref={rootRef as React.RefObject<HTMLHeadingElement>}
      className={["relative", className].filter(Boolean).join(" ")}
    >
      <span className="sr-only">
        {ariaLabel ?? lines.map((l) => (typeof l === "string" ? l : "")).join(" ")}
      </span>
      <span aria-hidden className="block">
        {lines.map((line, i) => (
          <span
            key={i}
            ref={(el) => {
              lineRefs.current[i] = el;
            }}
            className="animated-line relative block overflow-hidden"
            style={{ ["--progress" as string]: 0 } as React.CSSProperties}
          >
            <span className="animated-line-inner block">{line}</span>
          </span>
        ))}
      </span>
    </Tag>
  );
}
