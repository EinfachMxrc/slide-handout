"use client";

import { useEffect, useRef, useState } from "react";

interface MarqueeProps {
  children: React.ReactNode;
  /** Sekunden für eine komplette Loop-Runde. Default 40. */
  duration?: number;
  /** Richtung — Air verwendet zwei Reihen, eine pro Richtung. */
  direction?: "left" | "right";
  className?: string;
}

/**
 * Air-style Endless-Marquee — der Inhalt wird zweimal gerendert, sodass
 * die Translation `var(--loop-point)` (= -50%) nahtlos zurück auf 0
 * springen kann. Linear, weil jede Easing-Kurve hier sichtbar ruckeln würde.
 *
 * Pausiert auf Hover und respektiert prefers-reduced-motion.
 */
export function Marquee({
  children,
  duration = 40,
  direction = "left",
  className = "",
}: MarqueeProps): React.ReactElement {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPaused(true);
    }
  }, []);

  const animation = paused
    ? undefined
    : `air-marquee ${duration}s linear infinite${direction === "right" ? " reverse" : ""}`;

  return (
    <div
      className={`overflow-hidden ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        className="flex w-max items-center gap-12"
        style={{
          animation,
          // -50% weil wir den Inhalt zweimal rendern — bei -50% sind wir
          // exakt am Anfang der zweiten Kopie, der Sprung ist unsichtbar.
          ["--loop-point" as string]: "-50%",
        }}
      >
        <div className="flex shrink-0 items-center gap-12">{children}</div>
        <div aria-hidden className="flex shrink-0 items-center gap-12">
          {children}
        </div>
      </div>
    </div>
  );
}
