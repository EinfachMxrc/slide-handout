"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { SkyBackground } from "./sky-background";
import { DemoButton } from "./demo-button";

// Client-only: Wordmark animiert mit useEffect/rAF, braucht kein SSR.
const CueGlassWordmark = dynamic(
  () => import("./cue-glass-wordmark").then((m) => m.CueGlassWordmark),
  { ssr: false },
);

/**
 * AirIntroScene — Landing-Hero mit handgeschriebenem "Cue"-Wordmark,
 * das nach der Entry-Animation via FLIP in den Nav-Brand-Slot fliegt.
 *
 * Aufbau:
 *   - SkyBackground (Cloud-Layer, fade in beim Mount)
 *   - CueGlassWordmark (pure SVG, keine WebGL mehr) zentriert im Hero
 *   - Hero-Handoff Glass-Card unten mit Headline + CTA + Pills
 *
 * Choreografie:
 *   t=0       Cloud-Layer fade in
 *   t=0.1     Handschrift startet (C → u → e, ~5s insgesamt)
 *   t=1.4     Hero-Handoff-Card fade in
 *   t~5.0     onSettled → FLIP: Hero-Cue fliegt hoch ins Nav-Brand-Slot,
 *             skaliert runter, landet exakt auf #air-brand-target.
 *             Nav-"Cue" fadet ein, Hero fadet aus → Brand bleibt oben.
 *
 * Bei prefers-reduced-motion: statische Darstellung, kein FLIP.
 */
export function AirIntroScene({
  loggedIn,
}: {
  loggedIn: boolean;
}): React.ReactElement {
  const root = useRef<HTMLElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  // Phase-Gate: sobald das FLIP ins Nav-Slot durch ist, kollabiert die
  // Section, der Sky fadet aus und die Glass-Card rides up in den neuen
  // statischen End-State. Einmalig — kein Reset.
  const [introDone, setIntroDone] = useState(false);

  useLayoutEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setReduceMotion(true);
    }
  }, []);

  useLayoutEffect(() => {
    const target = document.getElementById("air-brand-target");

    if (reduceMotion) {
      setIntroDone(true);
      if (target) target.style.opacity = "1";
      gsap.set(
        root.current?.querySelectorAll(".hero-handoff > *") ?? [],
        { opacity: 1, y: 0, filter: "blur(0px)" },
      );
      // Nur opacity setzen — die CSS-Keyframe-Transforms (cloud-drift-*)
      // müssen ungehindert laufen. Inline transform würde sie blockieren.
      gsap.set(
        root.current?.querySelectorAll(
          ".cloud-drift-slow,.cloud-drift-mid,.cloud-drift-fast,.cloud-drift-wisp",
        ) ?? [],
        { opacity: 1 },
      );
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // KRITISCH: Cloud-Layer animieren NUR opacity. Kein scale, keine
      // inline transforms — sonst übersteuert GSAP die CSS-Drift-Keyframes
      // und der Himmel steht still. Vor-Fade gesetzt via opacity:0.
      tl.set(
        [
          ".cloud-drift-slow",
          ".cloud-drift-mid",
          ".cloud-drift-fast",
          ".cloud-drift-wisp",
        ],
        { opacity: 0 },
      ).set(".hero-handoff > *", {
        opacity: 0,
        y: 24,
        filter: "blur(8px)",
      });

      tl.to(
        [
          ".cloud-drift-slow",
          ".cloud-drift-mid",
          ".cloud-drift-fast",
          ".cloud-drift-wisp",
        ],
        {
          opacity: (i) => [0.9, 0.95, 0.96, 0.7][i] ?? 0.9,
          duration: 0.55,
          stagger: 0.04,
          ease: "power2.out",
        },
        0,
      ).to(
        ".hero-handoff > *",
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.42,
          stagger: 0.04,
          ease: "power3.out",
        },
        0.65,
      );
    }, root);

    return () => ctx.revert();
  }, [reduceMotion]);

  // onSettled vom Wordmark → FLIP in den Nav-Brand-Slot.
  // 1. Delta zwischen Hero-BBox und Target-BBox berechnen
  // 2. Hero via transform (x/y/scale) zum Target-Rect morphen
  // 3. Kurz bevor Hero "landet": Target-Text fadet ein, Hero fadet aus
  // → Das Cue bleibt als Brand im Header stehen.
  function handleResolved(): void {
    const target = document.getElementById("air-brand-target");
    const wordmark = wordmarkRef.current;
    if (!wordmark || !target) return;

    const from = wordmark.getBoundingClientRect();
    const to = target.getBoundingClientRect();

    // Center-zu-Center-Translate + Scale auf Breite des Target-Texts.
    // Breite ist stabiler als Höhe (Line-Box-Overhead beim Target).
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const scale = to.width / from.width;

    // Vor dem FLIP: teure drop-shadow-Filter am SVG-Text killen. Die
    // filter-Neurasterung bei jedem Scale-Frame war die Hauptquelle für
    // das Ruckeln in der alten Animation.
    const svgTexts = wordmark.querySelectorAll<SVGTextElement>("svg text");
    svgTexts.forEach((t) => {
      t.style.filter = "none";
    });

    gsap
      .timeline({
        defaults: { ease: "power2.out", force3D: true },
        onComplete: () => setIntroDone(true),
      })
      .to(
        wordmark,
        { x: dx, y: dy, scale, duration: 0.42 },
        0,
      )
      .to(target, { opacity: 1, duration: 0.18 }, 0.22)
      .to(wordmark, { opacity: 0, duration: 0.16 }, 0.3);
  }

  const pills = ["Schreiben", "Steuern", "Synchron"];

  return (
    <section
      ref={root}
      data-intro-done={introDone ? "true" : "false"}
      className="relative isolate overflow-hidden"
      style={{
        minHeight: introDone ? "62svh" : "100svh",
        transition: "min-height 1100ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Sky + Clouds bleiben permanent sichtbar und driften weiter — auch
       * nach dem Intro. Nur der helle radiale Highlight (Sonne) fadet aus,
       * weil der zum Intro-Spotlight gehörte. */}
      <SkyBackground />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[5]"
        style={{
          background:
            "radial-gradient(ellipse 50% 35% at 50% 38%, rgba(255,255,255,0.28), transparent 60%)",
          opacity: introDone ? 0 : 0.7,
          transition: "opacity 900ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />

      {/* Hero-Wordmark — zentriert per Flexbox, via FLIP in die Nav transportiert.
       * pointer-events:none damit Card-Buttons darunter klickbar bleiben. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
      >
        {!reduceMotion ? (
          <CueGlassWordmark
            onSettled={handleResolved}
            wrapperRef={wordmarkRef}
          />
        ) : (
          <span
            className="font-display italic text-white drop-shadow-[0_8px_40px_rgba(0,0,0,0.18)]"
            style={{
              fontSize: "clamp(8rem, 24vw, 18rem)",
              lineHeight: 1,
              fontWeight: 500,
              letterSpacing: "-0.04em",
            }}
          >
            Cue
          </span>
        )}
      </div>

      <h1 className="sr-only">Cue — Live ausgelöst. Nicht vorausgeschickt.</h1>

      {/* Hero-Handoff: Glass-Card unten — Headline, CTAs, Pills */}
      <div className="absolute inset-x-0 bottom-8 z-20 px-4 sm:bottom-12">
        <div className="hero-handoff mx-auto w-full max-w-3xl rounded-[28px] border border-white/20 bg-white/10 p-6 text-center backdrop-blur-xl sm:p-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/85">
            Cue
          </p>
          <h2 className="mt-3 font-display text-3xl leading-[0.95] tracking-[-0.02em] text-white sm:text-5xl">
            Live ausgelöst.{" "}
            <em className="font-display italic text-white/85">
              Nicht vorausgeschickt.
            </em>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
            Das Handout, das Inhalte erst freigibt,{" "}
            <em className="font-display italic">wenn du sie zeigst.</em>
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {loggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-pill bg-white px-6 py-3 text-sm font-semibold text-ink shadow-[0_4px_24px_rgba(0,0,0,0.18)] transition hover:bg-white/90"
                >
                  Zum Dashboard
                </Link>
                <Link
                  href="/handouts/new"
                  className="rounded-pill border border-white/20 bg-white/[0.08] px-6 py-3 text-sm font-medium text-white backdrop-blur-xl transition hover:bg-white/15"
                >
                  Neues Handout
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="rounded-pill bg-white px-6 py-3 text-sm font-semibold text-ink shadow-[0_4px_24px_rgba(0,0,0,0.18)] transition hover:bg-white/90"
                >
                  Kostenlos testen
                </Link>
                <DemoButton
                  className="rounded-pill border border-white/20 bg-white/[0.08] px-6 py-3 text-sm font-medium text-white backdrop-blur-xl transition hover:bg-white/15"
                  label="Demo ansehen"
                />
              </>
            )}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {pills.map((p) => (
              <span
                key={p}
                className="rounded-pill border border-white/15 bg-white/[0.06] px-3 py-1 text-[11px] font-medium text-white/85"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
