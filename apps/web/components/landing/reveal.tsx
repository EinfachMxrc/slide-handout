"use client";

import { useEffect, useRef, useState } from "react";

interface RevealProps {
  children: React.ReactNode;
  /** Stagger-Index (0-4). Verschiebt die Transition-Delay um 80ms-Stufen. */
  delay?: 0 | 1 | 2 | 3 | 4;
  className?: string;
}

/**
 * Reveal-Wrapper — markiert ein Element mit data-reveal/data-revealed,
 * sodass die globalen [data-reveal] Styles aus globals.css greifen.
 *
 * Strategie:
 *   1. Wenn das Element bereits beim Mount sichtbar ist (above-the-fold)
 *      → sofort reveal. Keine FOUC-Phase.
 *   2. Sonst IntersectionObserver (only-once).
 *   3. Plus Scroll-Listener-Fallback für Umgebungen, in denen IO nicht
 *      zuverlässig feuert (manche Headless-Chromiums).
 *
 * Air-Pattern: opacity 0 → 1, translateY 24px → 0, blur 6px → 0,
 * über 0.8s mit cubic-bezier(0.22, 1, 0.36, 1).
 */
export function Reveal({
  children,
  delay,
  className,
}: RevealProps): React.ReactElement {
  const ref = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (revealed) return;
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(true);
      return;
    }

    const checkVisible = (): boolean => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 0;
      const margin = vh * 0.1;
      // 15% des Elements muss sichtbar sein.
      const visible = Math.max(
        0,
        Math.min(rect.bottom, vh - margin) - Math.max(rect.top, 0),
      );
      return rect.height > 0 && visible / rect.height > 0.15;
    };

    if (checkVisible()) {
      setRevealed(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setRevealed(true);
            return;
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.15 },
    );
    obs.observe(el);

    // Fallback: Scroll-Listener für Umgebungen, in denen IO nicht feuert.
    const onScroll = (): void => {
      if (checkVisible()) {
        setRevealed(true);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      obs.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [revealed]);

  return (
    <div
      ref={ref}
      data-reveal=""
      data-revealed={revealed ? "true" : "false"}
      data-reveal-delay={delay ?? undefined}
      className={className}
    >
      {children}
    </div>
  );
}
