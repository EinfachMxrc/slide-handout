"use client";

import { useEffect, useRef, type RefObject } from "react";
import gsap from "gsap";

/**
 * CueGlassWordmark — echtes "geschrieben werden" Gefühl.
 *
 * Zwei gestaffelte Phasen, getrieben von einem GSAP-scalar 0→1 über 5.2s:
 *
 * 1. **Stroke-Trace** (0.0 – 0.85 von progress):
 *    Pacifico-Text rendert als SVG-<text> mit `fill="none" stroke="..."`
 *    und animiertem `stroke-dashoffset` → die Outline jedes Buchstabens
 *    wird live "mit Stift nachgezeichnet". Weiße halbtransparente Linie.
 *
 * 2. **Fill-Reveal** (0.55 – 1.0 von progress):
 *    Zweiter <text> identisch positioniert, mit gradient-fill, opacity
 *    fadet von 0 → 1 ein → die "Tinte füllt sich in die gezeichneten
 *    Outlines". Am Ende: sattes Glas-Weiß-Blau-Gradient.
 *
 * **Pen-Tip** (0.02 – 0.98): ein leuchtender Circle läuft L→R entlang
 * der Baseline mit Sinus-Y-Wobble, `mix-blend-mode: screen`. Das ist
 * das visuelle Schreib-Cue — "hier schreibt jemand gerade".
 *
 * Alle Per-Frame-Updates gehen direkt via DOM-setAttribute in der GSAP
 * onUpdate-Callback — keine React-Rerenders, 60fps garantiert.
 *
 * FLIP-kompatibel: wrapperRef hat tight layout-box um den SVG-Container.
 */

const VB_W = 1200;
const VB_H = 500;
const DURATION = 2.4;
const DELAY = 0.05;
const SETTLE = 0.08;

// Stroke-Dasharray-Länge — Pacifico "Cue" outline ist ~2400-3000 units
// bei fontSize VB_H*0.85. Großzügig wählen damit offset sicher über
// die volle Länge animieren kann.
const STROKE_LEN = 3600;

interface CueGlassWordmarkProps {
  onSettled?: () => void;
  wrapperRef?: RefObject<HTMLDivElement | null>;
}

export function CueGlassWordmark({
  onSettled,
  wrapperRef,
}: CueGlassWordmarkProps): React.ReactElement {
  const settledRef = useRef(false);
  const penRef = useRef<SVGGElement | null>(null);
  const strokeTextRef = useRef<SVGTextElement | null>(null);
  const fillTextRef = useRef<SVGTextElement | null>(null);

  useEffect(() => {
    const state = { v: 0 };
    const penPadding = 90;
    const penWidth = VB_W - penPadding * 2;
    const penBaseY = VB_H * 0.48;

    const apply = () => {
      const v = state.v;

      // Phase 1: Stroke-Trace 0 → 0.85 (fertig geschrieben bei 85%)
      const strokeProgress = Math.min(1, v / 0.85);
      const dashOffset = STROKE_LEN * (1 - strokeProgress);
      // Nachdem stroke fertig ist, fadet die stroke-line selbst aus damit
      // nur noch der saubere gefüllte Text stehen bleibt.
      const strokeOpacity =
        v < 0.82
          ? 0.85
          : Math.max(0, 0.85 * (1 - (v - 0.82) / 0.18));
      strokeTextRef.current?.setAttribute(
        "stroke-dashoffset",
        String(dashOffset),
      );
      strokeTextRef.current?.setAttribute(
        "opacity",
        String(strokeOpacity),
      );

      // Phase 2: Fill-Reveal 0.55 → 1.0
      const fillStart = 0.55;
      const fillProgress =
        v < fillStart ? 0 : Math.min(1, (v - fillStart) / (1 - fillStart));
      fillTextRef.current?.setAttribute("opacity", String(fillProgress));

      // Pen-Tip entlang der Reveal-Kante, mit Sinus-Y-Wobble (Handschrift-Rhythmus)
      if (penRef.current) {
        const cx = penPadding + v * penWidth;
        // Sinus mit ~4 Wellen über die Reveal-Dauer = ~0.8 Hz Wobble
        const wobble = Math.sin(v * Math.PI * 8) * 6;
        penRef.current.setAttribute(
          "transform",
          `translate(${cx}, ${penBaseY + wobble})`,
        );
        const vis = v > 0.01 && v < 0.92 ? "1" : "0";
        penRef.current.setAttribute("opacity", vis);
      }
    };

    apply();

    const tween = gsap.to(state, {
      v: 1,
      duration: DURATION,
      delay: DELAY,
      ease: "power1.inOut",
      onUpdate: apply,
      onComplete: () => {
        if (settledRef.current) return;
        settledRef.current = true;
        window.setTimeout(() => onSettled?.(), SETTLE * 1000);
      },
    });

    return () => {
      tween.kill();
    };
  }, [onSettled]);

  const textProps = {
    x: VB_W / 2,
    y: VB_H * 0.72,
    textAnchor: "middle" as const,
    fontFamily: "var(--font-pacifico), 'Pacifico', cursive",
    fontSize: VB_H * 0.7,
    fontWeight: 400,
    fontStyle: "normal" as const,
    letterSpacing: "-0.01em",
  };

  return (
    <div
      ref={wrapperRef}
      style={{
        width: "min(74vw, 960px)",
        aspectRatio: `${VB_W} / ${VB_H}`,
        willChange: "transform, opacity",
      }}
    >
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <defs>
          <linearGradient id="cue-fill-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="55%" stopColor="#eef4ff" stopOpacity="0.97" />
            <stop offset="100%" stopColor="#b9d3ff" stopOpacity="0.92" />
          </linearGradient>

          <radialGradient id="cue-pen-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,1)" />
            <stop offset="25%" stopColor="rgba(225,240,255,0.95)" />
            <stop offset="60%" stopColor="rgba(150,200,255,0.45)" />
            <stop offset="100%" stopColor="rgba(120,180,255,0)" />
          </radialGradient>
        </defs>

        {/* Phase 1: Stroke-Trace — Outline wird live nachgezeichnet */}
        <text
          ref={strokeTextRef}
          {...textProps}
          fill="none"
          stroke="rgba(255,255,255,0.88)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={STROKE_LEN}
          strokeDashoffset={STROKE_LEN}
          opacity="0.85"
          style={{
            filter: "drop-shadow(0 0 8px rgba(255,255,255,0.55))",
          }}
        >
          Cue
        </text>

        {/* Phase 2: Fill-Reveal — Tinte füllt die Outlines */}
        <text
          ref={fillTextRef}
          {...textProps}
          fill="url(#cue-fill-grad)"
          opacity="0"
          style={{
            filter:
              "drop-shadow(0 0 20px rgba(255,255,255,0.45)) drop-shadow(0 8px 38px rgba(120,180,255,0.45))",
          }}
        >
          Cue
        </text>

        {/* Pen-Tip Glow — der "Schreibende Stift" */}
        <g ref={penRef} opacity="0" transform={`translate(0, ${VB_H * 0.48})`}>
          <circle
            r="26"
            fill="url(#cue-pen-glow)"
            style={{ mixBlendMode: "screen" }}
          />
          <circle r="4" fill="rgba(255,255,255,0.95)" />
        </g>
      </svg>
    </div>
  );
}
