"use client";

import { useEffect, useRef } from "react";

/**
 * Hero-Wordmark mit Scroll-Parallax — der Wortschriftzug wandert mit der
 * Hälfte der Scroll-Geschwindigkeit nach oben und skaliert leicht hoch,
 * sodass er sich beim Scrollen "in den Himmel hebt".
 *
 * Verbatim Air-Pattern: rAF-Loop, transform-only (compositor-friendly),
 * keine Layout-Shifts. Pause bei prefers-reduced-motion.
 */
export function HeroWordmark({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const ref = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const tick = (): void => {
      const y = window.scrollY;
      // Parallax-Faktor 0.4 = Wortmarke wandert mit 40% der Scroll-Speed nach oben.
      // Skalierung läuft bis 1.15 bei einer Bildschirmhöhe Scroll.
      const vh = window.innerHeight || 1;
      const ratio = Math.min(y / vh, 1);
      const translate = -y * 0.4;
      const scale = 1 + ratio * 0.15;
      const opacity = 1 - ratio * 0.6;
      el.style.transform = `translate3d(0, ${translate}px, 0) scale(${scale})`;
      el.style.opacity = String(opacity);
      raf = 0;
    };

    const onScroll = (): void => {
      if (raf) return;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    tick();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <h1
      ref={ref}
      className="glass-display select-none text-center"
      style={{
        fontSize: "clamp(6rem, 22vw, 18rem)",
        willChange: "transform, opacity",
      }}
    >
      {children}
    </h1>
  );
}
