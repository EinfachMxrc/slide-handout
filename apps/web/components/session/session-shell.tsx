"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Segmented } from "#/components/dashboard/segmented";
import { BlockRenderer } from "#/components/reader/block-renderer";

interface Block {
  _id: Id<"blocks">;
  rank: string;
  title: string;
  markdown: string;
  notes?: string;
  trigger: "slide" | "always" | "manual";
  slideNumber?: number;
  layout: "default" | "centered" | "wide" | "compact" | "terminal";
  imagePosition: "top" | "bottom" | "left" | "right" | "full" | "background";
  fontSize: "sm" | "base" | "lg" | "xl";
  imageS3Key?: string;
  imageUrl?: string;
  imageCaption?: string;
  terminalVariant?: "neutral" | "success" | "danger";
  terminalLabel?: string;
}

type SyncMode = "auto" | "hybrid" | "manual";

/**
 * Presenter-Konsole — editorial dark-glass treatment:
 *   - Hero-Header: Breadcrumb + eyebrow "Präsentation" + italic display
 *     Titel, Live-/Entwurf-Chip mit Puls, CTAs (Start/End + Reader).
 *   - Stat-Trio: Public-Link, Zuschauer (Puls bei >0), Reveal-Ratio als
 *     italic Display-Numerals.
 *   - Segmented Steuerung / Vorschau.
 *   - Control: Folien-Nav mit Mega-Numeral + PowerPoint-Card mit
 *     Sky-Echo + BlockList mit Next-Up Spotlight und Reveal-Queue.
 *
 * Gesamte Logic (start/end, reveal/unreveal, slide-nav, sync-mode,
 * keyboard ←/→/Space/Backspace) unverändert.
 */
export function SessionShell({
  handout,
  blocks,
  publicUrl,
}: {
  handout: {
    _id: Id<"handouts">;
    title: string;
    publicToken: string;
  };
  blocks: Block[];
  publicUrl: string;
}): React.ReactElement {
  const [sessionId, setSessionId] = useState<Id<"presenterSessions"> | null>(
    null,
  );
  const [syncMode, setSyncMode] = useState<SyncMode>("manual");
  const [tab, setTab] = useState<"control" | "preview">("control");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slideJump, setSlideJump] = useState("");

  const reveals = useQuery(
    api.reveals.streamForSession,
    sessionId ? { presenterSessionId: sessionId } : "skip",
  );
  const audienceCount = useQuery(
    api.audience.countForSession,
    sessionId ? { presenterSessionId: sessionId } : "skip",
  );
  const sessionDoc = useQuery(
    api.sessions.publicState,
    sessionId ? { presenterSessionId: sessionId } : "skip",
  );
  const currentSlide = sessionDoc?.currentSlide ?? 1;

  useEffect(() => {
    if (sessionDoc?.syncMode) setSyncMode(sessionDoc.syncMode as SyncMode);
  }, [sessionDoc?.syncMode]);

  const revealedSet = useMemo(
    () => new Set(reveals?.items.map((r) => r.blockId) ?? []),
    [reveals],
  );
  const sortedBlocks = useMemo(
    () =>
      [...blocks]
        .filter((b) => b.trigger !== "always")
        .sort((a, b) => a.rank.localeCompare(b.rank)),
    [blocks],
  );
  const visibleBlocks = useMemo(
    () => blocks.filter((b) => b.trigger === "always" || revealedSet.has(b._id)),
    [blocks, revealedSet],
  );
  const nextToReveal = useMemo(
    () => sortedBlocks.find((b) => !revealedSet.has(b._id)),
    [sortedBlocks, revealedSet],
  );
  const lastRevealed = useMemo(() => {
    if (!reveals) return null;
    const items = reveals.items;
    for (let i = items.length - 1; i >= 0; i--) {
      const id = items[i]!.blockId;
      if (sortedBlocks.some((b) => b._id === id)) return id;
    }
    return null;
  }, [reveals, sortedBlocks]);

  async function startSession(): Promise<void> {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/presenter-sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handoutId: handout._id }),
      });
      if (!res.ok) {
        setError("Konnte Session nicht starten.");
        return;
      }
      const data = (await res.json()) as { id: string };
      setSessionId(data.id as Id<"presenterSessions">);
    } finally {
      setStarting(false);
    }
  }

  async function endSession(): Promise<void> {
    if (!sessionId) return;
    if (!confirm("Session beenden?")) return;
    await fetch(`/api/presenter-sessions/${sessionId}`, { method: "DELETE" });
    setSessionId(null);
  }

  async function setSlide(n: number): Promise<void> {
    if (!sessionId || n < 1) return;
    await fetch(`/api/presenter-sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slideNumber: n }),
    });
  }

  async function saveSyncMode(mode: SyncMode): Promise<void> {
    setSyncMode(mode);
    if (!sessionId) return;
    await fetch(`/api/presenter-sessions/${sessionId}/settings`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ syncMode: mode }),
    });
  }

  async function reveal(blockId: Id<"blocks">): Promise<void> {
    if (!sessionId) return;
    await fetch("/api/reveals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ presenterSessionId: sessionId, blockId }),
    });
  }
  async function unreveal(blockId: Id<"blocks">): Promise<void> {
    if (!sessionId) return;
    await fetch("/api/reveals/single", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ presenterSessionId: sessionId, blockId }),
    });
  }

  const revealNext = useCallback(async () => {
    if (nextToReveal) await reveal(nextToReveal._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextToReveal, sessionId]);
  const unrevealLast = useCallback(async () => {
    if (lastRevealed) await unreveal(lastRevealed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastRevealed, sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    function onKey(e: KeyboardEvent): void {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === " " || e.key === "ArrowRight") {
        e.preventDefault();
        void revealNext();
      } else if (e.key === "ArrowLeft" || e.key === "Backspace") {
        e.preventDefault();
        void unrevealLast();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sessionId, revealNext, unrevealLast]);

  const live = sessionId !== null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10">
      <SessionHeader
        handout={handout}
        live={live}
        starting={starting}
        publicUrl={publicUrl}
        onStart={startSession}
        onEnd={endSession}
      />
      <SessionStats
        publicUrl={publicUrl}
        audienceCount={audienceCount ?? 0}
        revealedCount={revealedSet.size}
        totalBlocks={sortedBlocks.length}
        live={live}
      />
      {error && (
        <div
          role="alert"
          className="rounded-card border border-salmon-400/30 bg-salmon-500/10 px-4 py-3 text-sm text-salmon-200"
        >
          {error}
        </div>
      )}

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: "control", label: "Steuerung" },
          { value: "preview", label: "Vorschau" },
        ]}
      />

      {tab === "control" ? (
        <ControlTab
          live={live}
          currentSlide={currentSlide}
          onSlideJump={async () => {
            const n = Number(slideJump);
            if (n > 0) await setSlide(n);
          }}
          slideJumpValue={slideJump}
          setSlideJumpValue={setSlideJump}
          onPrev={() => setSlide(Math.max(1, currentSlide - 1))}
          onNext={() => setSlide(currentSlide + 1)}
          syncMode={syncMode}
          onSyncMode={saveSyncMode}
          blocks={sortedBlocks}
          revealedSet={revealedSet}
          nextToReveal={nextToReveal ?? null}
          onReveal={reveal}
          onUnreveal={unreveal}
        />
      ) : (
        <PreviewTab blocks={visibleBlocks} live={live} />
      )}
    </div>
  );
}

/* ——— Header ——— */

function SessionHeader({
  handout,
  live,
  starting,
  publicUrl,
  onStart,
  onEnd,
}: {
  handout: { _id: Id<"handouts">; title: string };
  live: boolean;
  starting: boolean;
  publicUrl: string;
  onStart: () => void;
  onEnd: () => void;
}): React.ReactElement {
  return (
    <header>
      <nav className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-white/45">
        <Link href="/dashboard" className="transition-colors hover:text-teal-300">
          Dashboard
        </Link>
        <span aria-hidden className="text-white/25">
          /
        </span>
        <Link
          href={`/handouts/${handout._id}`}
          className="transition-colors hover:text-teal-300"
        >
          {handout.title}
        </Link>
        <span aria-hidden className="text-white/25">
          /
        </span>
        <span className="text-white/70">Session</span>
      </nav>

      <section className="relative mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-navy-900/80 via-navy-900/60 to-navy-950/90 p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-1/4 -top-1/2 -z-10 h-[500px] w-[500px] rounded-full"
          style={{
            background: live
              ? "radial-gradient(closest-side, rgba(52,211,153,0.22), transparent 70%)"
              : "radial-gradient(closest-side, rgba(94,234,212,0.18), transparent 70%)",
          }}
        />

        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-teal-300/80">
          Präsentation
        </p>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[clamp(2.25rem,3.5vw,3.25rem)] italic leading-[0.95] tracking-[-0.02em] text-white">
              {handout.title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70">
              Folienstand, manuelle Blöcke, QR-Zugang und PowerPoint-
              Anbindung — alles aus einer kompakten Session-Oberfläche
              gesteuert.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-3">
            <LiveChip live={live} />
            <div className="flex flex-wrap items-center gap-2">
              {live ? (
                <button
                  onClick={onEnd}
                  className="inline-flex items-center gap-2 rounded-pill bg-salmon-500/90 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(251,113,133,0.55)] transition hover:bg-salmon-400"
                >
                  Session beenden
                </button>
              ) : (
                <button
                  onClick={onStart}
                  disabled={starting}
                  className="inline-flex items-center gap-2 rounded-pill bg-teal-400 px-5 py-2.5 text-sm font-semibold text-navy-1000 shadow-[0_10px_30px_-10px_rgba(94,234,212,0.65)] transition hover:bg-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-400/30 disabled:cursor-not-allowed disabled:bg-teal-400/50"
                >
                  {starting ? "Starte …" : "Session starten"}
                  <span aria-hidden>→</span>
                </button>
              )}
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-pill border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white/85 transition hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
              >
                Reader öffnen
                <span aria-hidden>↗</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </header>
  );
}

function LiveChip({ live }: { live: boolean }): React.ReactElement {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-pill px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] ${
        live
          ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
          : "border border-white/10 bg-white/[0.04] text-white/55"
      }`}
    >
      <span
        aria-hidden
        className={`relative inline-flex h-1.5 w-1.5 rounded-full ${live ? "bg-emerald-400" : "bg-white/40"}`}
      >
        {live && (
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-75" />
        )}
      </span>
      {live ? "Live" : "Entwurf"}
    </span>
  );
}

/* ——— Stats ——— */

function SessionStats({
  publicUrl,
  audienceCount,
  revealedCount,
  totalBlocks,
  live,
}: {
  publicUrl: string;
  audienceCount: number;
  revealedCount: number;
  totalBlocks: number;
  live: boolean;
}): React.ReactElement {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard label="Öffentlicher Link" span>
        <code className="block truncate font-mono text-xs text-teal-200">
          {publicUrl}
        </code>
      </StatCard>
      <StatCard label="Zuschauer" live={live && audienceCount > 0}>
        <p className="font-display text-5xl italic leading-none tracking-[-0.02em] text-white">
          {live ? audienceCount : 0}
        </p>
      </StatCard>
      <StatCard label="Freigegeben">
        <p className="font-display text-5xl italic leading-none tracking-[-0.02em] text-white">
          {revealedCount}
          <span className="ml-2 font-sans text-base not-italic text-white/50">
            / {totalBlocks}
          </span>
        </p>
      </StatCard>
    </div>
  );
}

function StatCard({
  label,
  children,
  live,
  span,
}: {
  label: string;
  children: React.ReactNode;
  live?: boolean;
  span?: boolean;
}): React.ReactElement {
  return (
    <div
      className={`group relative overflow-hidden rounded-[20px] border border-white/10 bg-navy-900/60 px-5 py-5 backdrop-blur-xl transition-colors hover:border-white/20 ${span ? "flex flex-col justify-center" : ""}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/50">
          {label}
        </p>
        {live && (
          <span
            aria-hidden
            className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-400"
          >
            <span className="absolute inset-0 animate-ping rounded-full bg-teal-400 opacity-75" />
          </span>
        )}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

/* ——— Control Tab ——— */

function ControlTab(props: {
  live: boolean;
  currentSlide: number;
  onSlideJump: () => void;
  slideJumpValue: string;
  setSlideJumpValue: (v: string) => void;
  onPrev: () => void;
  onNext: () => void;
  syncMode: SyncMode;
  onSyncMode: (m: SyncMode) => void;
  blocks: Block[];
  revealedSet: Set<Id<"blocks">>;
  nextToReveal: Block | null;
  onReveal: (id: Id<"blocks">) => void;
  onUnreveal: (id: Id<"blocks">) => void;
}): React.ReactElement {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <SlideNav {...props} />
      <PowerPointCard live={props.live} />
      <div className="lg:col-span-2">
        <BlockList
          blocks={props.blocks}
          revealedSet={props.revealedSet}
          nextToReveal={props.nextToReveal}
          live={props.live}
          onReveal={props.onReveal}
          onUnreveal={props.onUnreveal}
        />
      </div>
    </div>
  );
}

/* ——— Slide Nav Panel ——— */

function SlideNav({
  live,
  currentSlide,
  onSlideJump,
  slideJumpValue,
  setSlideJumpValue,
  onPrev,
  onNext,
  syncMode,
  onSyncMode,
}: {
  live: boolean;
  currentSlide: number;
  onSlideJump: () => void;
  slideJumpValue: string;
  setSlideJumpValue: (v: string) => void;
  onPrev: () => void;
  onNext: () => void;
  syncMode: SyncMode;
  onSyncMode: (m: SyncMode) => void;
}): React.ReactElement {
  return (
    <section className="rounded-[24px] border border-white/10 bg-navy-900/60 p-7 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.5)] backdrop-blur-xl">
      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-teal-300/80">
        Session-Steuerung
      </p>
      <h2 className="mt-2 font-display text-2xl italic leading-tight text-white">
        Folien-Navigation
      </h2>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-[18px] border border-white/10 bg-navy-950/60 px-4 py-7">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/50">
            Aktuelle Folie
          </p>
          <p className="mt-2 font-display text-7xl italic leading-none tracking-[-0.03em] text-white">
            {live ? currentSlide : "–"}
          </p>
          <p className="mt-2 text-[11px] text-white/45">
            {live ? "Live übertragen" : "Nicht aktiv"}
          </p>
        </div>
        <div className="rounded-[18px] border border-white/10 bg-navy-950/60 px-4 py-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/50">
            Direkt springen
          </p>
          <div className="mt-3 flex gap-2">
            <input
              type="number"
              min={1}
              placeholder="Folie"
              value={slideJumpValue}
              onChange={(e) => setSlideJumpValue(e.target.value)}
              className="w-full rounded-pill border border-white/10 bg-navy-900/70 px-4 py-2 text-sm text-white placeholder:text-white/30 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-400/20"
            />
            <button
              onClick={onSlideJump}
              disabled={!live}
              className="rounded-pill border border-white/15 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-white/80 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Gehe zu
            </button>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              onClick={onPrev}
              disabled={!live || currentSlide <= 1}
              className="rounded-pill border border-white/15 px-3 py-2 text-xs font-medium text-white/80 transition hover:border-white/30 hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Zurück
            </button>
            <button
              onClick={onNext}
              disabled={!live}
              className="rounded-pill bg-teal-400 px-3 py-2 text-xs font-semibold text-navy-1000 shadow-[0_8px_24px_-10px_rgba(94,234,212,0.6)] transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:bg-teal-400/50"
            >
              Weiter →
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-white/10 pt-5">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-white/55">
          Sync-Modus
        </p>
        <Segmented
          value={syncMode}
          onChange={onSyncMode}
          size="sm"
          options={[
            { value: "auto", label: "Auto" },
            { value: "hybrid", label: "Hybrid" },
            { value: "manual", label: "Manuell" },
          ]}
        />
        <p className="mt-3 text-[11px] leading-relaxed text-white/50">
          <span className="text-white/70">Auto:</span> nur PowerPoint-Add-in
          löst aus · <span className="text-white/70">Hybrid:</span> beides ·{" "}
          <span className="text-white/70">Manuell:</span> nur Reveal-Buttons
          hier.
        </p>
      </div>
    </section>
  );
}

/* ——— PowerPoint Panel ——— */

function PowerPointCard({
  live,
}: {
  pairingCode?: string | null;
  live: boolean;
}): React.ReactElement {
  return (
    <section className="relative overflow-hidden rounded-[24px] border border-white/10 bg-navy-900/60 p-7 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.5)] backdrop-blur-xl">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-1/3 -top-1/3 -z-10 h-[300px] w-[300px] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(94,234,212,0.12), transparent 70%)",
        }}
      />
      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-teal-300/80">
        PowerPoint
      </p>
      <h2 className="mt-2 font-display text-2xl italic leading-tight text-white">
        Add-in &amp; Live-Verbindung
      </h2>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-white/70">
        Der Add-in läuft über dieselbe Web-App. Installieren, im Taskpane mit
        deinem Cue-Account anmelden — dann erscheint{" "}
        {live ? "diese Session" : "eine laufende Session"} direkt in der
        Auswahl. Folienwechsel werden automatisch gesendet.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <a
          href="/powerpoint-addin"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-pill bg-teal-400 px-4 py-2 text-xs font-semibold text-navy-1000 shadow-[0_8px_24px_-10px_rgba(94,234,212,0.55)] transition hover:bg-teal-300"
        >
          Install-Seite
          <span aria-hidden>↗</span>
        </a>
        <a
          href="/powerpoint-addin/manifest.xml"
          download="cue-addin.xml"
          className="inline-flex items-center gap-2 rounded-pill border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/85 transition hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
        >
          Manifest herunterladen
        </a>
      </div>
    </section>
  );
}

/* ——— Block List ——— */

function BlockList({
  blocks,
  revealedSet,
  nextToReveal,
  live,
  onReveal,
  onUnreveal,
}: {
  blocks: Block[];
  revealedSet: Set<Id<"blocks">>;
  nextToReveal: Block | null;
  live: boolean;
  onReveal: (id: Id<"blocks">) => void;
  onUnreveal: (id: Id<"blocks">) => void;
}): React.ReactElement {
  return (
    <section className="rounded-[24px] border border-white/10 bg-navy-900/60 p-7 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.5)] backdrop-blur-xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-teal-300/80">
            Reveal-Queue
          </p>
          <h2 className="mt-2 font-display text-2xl italic leading-tight text-white">
            Manuelle Blöcke
          </h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-pill border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
          {revealedSet.size}/{blocks.length} freigegeben
        </span>
      </div>

      {nextToReveal && live && (
        <div className="mt-5 flex items-center justify-between gap-4 overflow-hidden rounded-[18px] border border-teal-400/30 bg-gradient-to-r from-teal-400/15 via-teal-400/[0.08] to-transparent px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-teal-300">
              Als Nächstes
            </p>
            <p className="mt-1 truncate text-sm font-medium text-white">
              {nextToReveal.title}
            </p>
          </div>
          <button
            onClick={() => onReveal(nextToReveal._id)}
            className="inline-flex shrink-0 items-center gap-2 rounded-pill bg-teal-400 px-4 py-2 text-xs font-semibold text-navy-1000 shadow-[0_8px_24px_-10px_rgba(94,234,212,0.6)] transition hover:bg-teal-300"
          >
            Reveal
            <kbd className="rounded bg-navy-1000/40 px-1.5 py-0.5 font-mono text-[9px] text-navy-900/80">
              SPACE
            </kbd>
          </button>
        </div>
      )}

      {blocks.length === 0 ? (
        <p className="mt-6 rounded-[18px] border border-dashed border-white/10 bg-navy-950/40 px-6 py-10 text-center text-sm italic text-white/45">
          Keine manuellen Blöcke in diesem Handout.
        </p>
      ) : (
        <ul className="mt-5 space-y-2.5">
          {blocks.map((b, i) => {
            const revealed = revealedSet.has(b._id);
            return (
              <li
                key={b._id}
                className={`group flex items-center gap-4 rounded-[16px] border px-4 py-4 transition-colors ${
                  revealed
                    ? "border-emerald-400/30 bg-emerald-400/[0.08]"
                    : "border-white/10 bg-navy-950/50 hover:border-white/20"
                }`}
              >
                <span className="shrink-0 font-mono text-[10px] tracking-[0.2em] text-white/40">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {b.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/50">
                    <span className="uppercase tracking-[0.12em]">
                      {b.trigger}
                    </span>
                    {b.trigger === "slide" && b.slideNumber
                      ? ` · Folie ${b.slideNumber}`
                      : ""}
                  </p>
                  {b.notes && (
                    <p className="mt-2 whitespace-pre-wrap rounded-[8px] border-l-2 border-teal-400/60 bg-teal-400/5 px-3 py-1.5 text-[11px] italic leading-relaxed text-white/75">
                      {b.notes}
                    </p>
                  )}
                </div>
                {revealed ? (
                  <button
                    onClick={() => onUnreveal(b._id)}
                    disabled={!live}
                    className="shrink-0 rounded-pill border border-white/15 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-white/75 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Verbergen
                  </button>
                ) : (
                  <button
                    onClick={() => onReveal(b._id)}
                    disabled={!live}
                    className="shrink-0 rounded-pill bg-teal-400 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-navy-1000 shadow-[0_6px_18px_-6px_rgba(94,234,212,0.5)] transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:bg-teal-400/50"
                  >
                    Reveal
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {live && (
        <p className="mt-5 text-[11px] text-white/40">
          Tastatur:{" "}
          <kbd className="mx-1 rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px]">Space</kbd>{" "}
          oder{" "}
          <kbd className="mx-1 rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px]">→</kbd>{" "}
          revealt ·{" "}
          <kbd className="mx-1 rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px]">←</kbd>{" "}
          oder{" "}
          <kbd className="mx-1 rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px]">⌫</kbd>{" "}
          nimmt zurück.
        </p>
      )}
    </section>
  );
}

/* ——— Preview Tab ——— */

function PreviewTab({
  blocks,
  live,
}: {
  blocks: Block[];
  live: boolean;
}): React.ReactElement {
  if (!live) {
    return (
      <div className="rounded-[24px] border border-dashed border-white/10 bg-navy-900/40 px-8 py-16 text-center backdrop-blur-xl">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/40">
          Vorschau
        </p>
        <p className="mt-3 font-display text-xl italic text-white/65">
          Starte die Session, um zu sehen, was dein Publikum sieht.
        </p>
      </div>
    );
  }
  if (blocks.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-white/10 bg-navy-900/40 px-8 py-16 text-center backdrop-blur-xl">
        <p className="font-display text-xl italic text-white/65">
          Noch keine Blöcke sichtbar.
        </p>
        <p className="mt-2 text-xs text-white/45">
          Nutze{" "}
          <kbd className="mx-1 rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px]">Space</kbd>{" "}
          oder klicke „Reveal".
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-[24px] border border-white/10 bg-navy-950/40 p-6 backdrop-blur-xl sm:p-8">
      <p className="mb-5 text-[10px] font-medium uppercase tracking-[0.22em] text-white/40">
        Live-Vorschau · was das Publikum sieht
      </p>
      <div className="space-y-5">
        {blocks.map((b) => (
          <BlockRenderer key={b._id} block={b} />
        ))}
      </div>
    </div>
  );
}
