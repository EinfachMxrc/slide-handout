"use client";

import { useEffect, useRef } from "react";

export interface TriptychStep {
  /** Kleiner Label-Text über dem Titel (optional). */
  eyebrow?: string;
  /** Eigentliche Überschrift dieser Szene. */
  title: string;
  /** Italic-Akzent, der rechts neben dem Titel steht (optional). */
  accent?: string;
  /** Beschreibender Fließtext. */
  body: string;
  /** Schritt-Nummer (optional, wird als dezentes Monogramm gerendert). */
  n?: string;
}

interface StorytellingTriptychProps {
  steps: readonly TriptychStep[];
  /**
   * Wie viele Viewport-Höhen der Scroll-Container belegt.
   * Default 4 = jeder der 3 Schritte bekommt grob 1.33× Viewport-Scroll-Distanz.
   */
  scrollMultiplier?: number;
  className?: string;
  /** Optionales eyebrow für die gesamte Sektion (z. B. "So funktioniert's"). */
  sectionEyebrow?: string;
  /** Optionale Abschluss-Überschrift, die nach dem letzten Schritt erscheint. */
  trailing?: React.ReactNode;
}

/**
 * StorytellingTriptych — das air.inc-Pin-Pattern nachgebaut.
 *
 * Mechanik:
 *   1. Äußere `<section>` ist hoch (scrollMultiplier × 100vh).
 *   2. Innerer Container ist `position: sticky; top: 0; height: 100vh`.
 *      Dadurch "hakt" er beim Scrollen an der Oberkante ein.
 *   3. Drei (oder mehr) absolute Items liegen gestapelt im Pin und
 *      wechseln ihre Opacity basierend auf dem Scroll-Fortschritt durch
 *      den Pin.
 *
 * Kein GSAP ScrollTrigger, kein pin-spacer — reine CSS `sticky` +
 * rAF-gesteuerte `opacity`-Übergänge. Die "Crazy-Bewegung" entsteht, weil
 * während des Pins der globale Sky-Background weiter animiert bleibt.
 */
export function StorytellingTriptych({
  steps,
  scrollMultiplier = 4,
  className,
  sectionEyebrow,
  trailing,
}: StorytellingTriptychProps): React.ReactElement {
  const rootRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      // In Reduced-Motion: alle Schritte nacheinander als einfacher Stack anzeigen.
      for (const it of itemRefs.current) {
        if (it) {
          it.style.opacity = "1";
          it.style.position = "static";
        }
      }
      return;
    }

    let raf = 0;
    let active = false;

    const tick = (): void => {
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight;
      const pinHeight = rect.height - vh;
      // scrolled = wie viel Pixel wir bereits in den Pin eingedrungen sind.
      const scrolled = Math.max(0, Math.min(pinHeight, -rect.top));
      const progress = pinHeight > 0 ? scrolled / pinHeight : 0;

      const n = itemRefs.current.length;
      for (let i = 0; i < n; i++) {
        const it = itemRefs.current[i];
        if (!it) continue;
        // Zentrum jedes Schritts in progress-Space.
        const center = (i + 0.5) / n;
        // Normierte Distanz vom Zentrum (0 = perfekt im Zentrum, 1 = am nächsten Nachbar-Zentrum).
        const dist = Math.abs(progress - center) * n;
        // Weiche Falloff-Kurve: bis 0.5 komplett sichtbar, dann bis 1 ausfaden.
        let opacity: number;
        if (dist < 0.45) {
          opacity = 1;
        } else if (dist > 1.05) {
          opacity = 0;
        } else {
          const t = (dist - 0.45) / 0.6;
          opacity = 1 - t * t * (3 - 2 * t); // smoothstep
        }
        it.style.opacity = String(opacity);
        // Leichte Y-Parallax: Schritte gleiten sanft nach oben beim Übergang.
        const dy = (progress - center) * n * -12;
        it.style.transform = `translateY(${dy}px)`;
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
      { rootMargin: "0px" },
    );
    io.observe(root);

    return () => {
      active = false;
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  return (
    <section
      ref={rootRef as React.RefObject<HTMLElement>}
      className={["relative", className].filter(Boolean).join(" ")}
      style={{ height: `${scrollMultiplier * 100}vh` }}
    >
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
        <div className="relative w-full max-w-5xl px-6">
          {sectionEyebrow ? (
            <p className="absolute left-6 top-16 text-[11px] font-medium uppercase tracking-[0.24em] text-ink-mute">
              {sectionEyebrow}
            </p>
          ) : null}
          {steps.map((s, i) => (
            <div
              key={i}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center will-change-[opacity,transform]"
              style={{ opacity: 0 }}
            >
              {s.n ? (
                <span className="mb-6 font-display text-sm italic tracking-widest text-ink-mute/70">
                  {s.n}
                </span>
              ) : null}
              <h2 className="font-display text-5xl leading-[0.95] tracking-tight text-ink sm:text-7xl md:text-8xl">
                {s.title}
                {s.accent ? (
                  <>
                    {" "}
                    <em className="font-display italic text-ink-mute">{s.accent}</em>
                  </>
                ) : null}
              </h2>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-mute sm:text-lg">
                {s.body}
              </p>
            </div>
          ))}
          {trailing ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-12 flex justify-center text-xs text-ink-mute/60">
              {trailing}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
