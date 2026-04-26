"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Lenis-Smooth-Scroll — die Air-Signatur. Buttery RAF-Loop mit langem
 * Easing-Out, sodass Wheel/Trackpad-Scroll wie ein gleitender Kamerafahrt
 * wirkt statt wie ein Sprung.
 *
 * Mountet sich global, respektiert prefers-reduced-motion.
 */
export function SmoothScroll(): null {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 0.9,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.1,
      touchMultiplier: 2,
    });

    let raf = 0;
    const tick = (time: number): void => {
      lenis.raf(time);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
