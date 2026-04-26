"use client";

import { useEffect, useRef } from "react";

interface MouseTiltCardProps {
  children: React.ReactNode;
  /** Max rotation in deg. Default 6. Über 10° wirkt gimmicky. */
  maxTilt?: number;
  /** translateZ (px) wenn der Cursor drinnen ist. Default 24. */
  lift?: number;
  /** Smoothing-Faktor 0–1 — höher = snappier, niedriger = filmischer. Default 0.12. */
  smoothing?: number;
  className?: string;
  /** Zusätzliche Klassen auf das innere, getiltetete Card-Element. Nutze z. B. `rounded-[20px]`. */
  cardClassName?: string;
}

/**
 * MouseTiltCard — 3D-Mouse-Tilt im air.inc-Pattern.
 *
 * Struktur:
 *   <wrapper perspective>
 *     <card transform-style:preserve-3d; transform:rotateXY+translateZ>
 *       {children}
 *       <sheen absolut, Radial-Gradient folgt Cursor, mix-blend-overlay>
 *     </card>
 *   </wrapper>
 *
 * Mechanik:
 *   - `pointermove` → Target-Rotation (normalisiert auf -1..1 im Card-Rect).
 *   - rAF-Loop lerpt Current → Target mit `smoothing` und schreibt die
 *     Transform-Matrix. Ohne CSS-Transition auf der Transform, damit die
 *     Mausbewegung direkt reagiert.
 *   - `pointerleave` setzt Target auf 0; die Lerp fährt die Card sanft in
 *     Ruheposition zurück.
 *   - Sheen-Position wird über CSS-Vars `--sheen-x/-y` animiert; Opacity
 *     fade-out durch CSS-Transition beim Verlassen.
 *
 * Respektiert `prefers-reduced-motion` und deaktiviert sich dann komplett —
 * die Card bleibt als statisches Element sichtbar.
 */
export function MouseTiltCard({
  children,
  maxTilt = 6,
  lift = 24,
  smoothing = 0.12,
  className = "",
  cardClassName = "",
}: MouseTiltCardProps): React.ReactElement {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const card = cardRef.current;
    if (!wrapper || !card) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let hovering = false;

    const tick = (): void => {
      currentX += (targetX - currentX) * smoothing;
      currentY += (targetY - currentY) * smoothing;
      const rotY = currentX * maxTilt;
      const rotX = -currentY * maxTilt;
      // Während des Hovers voller Lift, beim Rückweg proportional zur Restauslenkung.
      const z = hovering
        ? lift
        : lift * Math.min(1, Math.hypot(currentX, currentY));
      card.style.transform = `translate3d(0, 0, ${z.toFixed(2)}px) rotateX(${rotX.toFixed(3)}deg) rotateY(${rotY.toFixed(3)}deg)`;
      card.style.setProperty("--sheen-x", `${(50 + currentX * 45).toFixed(2)}%`);
      card.style.setProperty("--sheen-y", `${(50 + currentY * 45).toFixed(2)}%`);
      card.style.setProperty("--sheen-opacity", hovering ? "1" : "0");

      const settling =
        Math.abs(targetX - currentX) > 0.002 ||
        Math.abs(targetY - currentY) > 0.002;
      if (hovering || settling) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    const start = (): void => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent): void => {
      // Ignoriere Touch-Input: fühlt sich auf mobilen Geräten daneben an und
      // wird durch passive Scrolls gestört.
      if (e.pointerType === "touch") return;
      const r = wrapper.getBoundingClientRect();
      targetX = ((e.clientX - r.left) / r.width) * 2 - 1;
      targetY = ((e.clientY - r.top) / r.height) * 2 - 1;
      hovering = true;
      start();
    };

    const onLeave = (): void => {
      targetX = 0;
      targetY = 0;
      hovering = false;
      start();
    };

    wrapper.addEventListener("pointermove", onMove);
    wrapper.addEventListener("pointerleave", onLeave);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      wrapper.removeEventListener("pointermove", onMove);
      wrapper.removeEventListener("pointerleave", onLeave);
    };
  }, [maxTilt, lift, smoothing]);

  return (
    <div
      ref={wrapperRef}
      className={["relative", className].filter(Boolean).join(" ")}
      style={{ perspective: "1200px" }}
    >
      <div
        ref={cardRef}
        className={["relative will-change-transform", cardClassName]
          .filter(Boolean)
          .join(" ")}
        style={{ transformStyle: "preserve-3d" }}
      >
        {children}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-overlay"
          style={{
            borderRadius: "inherit",
            background:
              "radial-gradient(circle at var(--sheen-x, 50%) var(--sheen-y, 50%), rgba(255,255,255,0.32), transparent 55%)",
            opacity: "var(--sheen-opacity, 0)",
            transition: "opacity 260ms ease",
          }}
        />
      </div>
    </div>
  );
}
