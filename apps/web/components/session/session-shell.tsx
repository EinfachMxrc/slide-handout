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

  // Hydrate syncMode from the live session record.
  useEffect(() => {
    if (sessionDoc?.syncMode) setSyncMode(sessionDoc.syncMode as SyncMode);
  }, [sessionDoc?.syncMode]);

  const revealedSet = useMemo(
    () => new Set(reveals?.map((r) => r.blockId) ?? []),
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
    for (let i = reveals.length - 1; i >= 0; i--) {
      const id = reveals[i]!.blockId;
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

  // Keyboard shortcuts (only when session is live).
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
    <div className="space-y-8">
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
        <p className="rounded-card border border-salmon-400/40 bg-salmon-400/10 px-4 py-3 text-sm text-salmon-300">
          {error}
        </p>
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
      <nav className="flex items-center gap-2 text-xs text-navy-400">
        <Link href="/dashboard" className="hover:text-white">
          Dashboard
        </Link>
        <span>/</span>
        <Link href={`/handouts/${handout._id}`} className="hover:text-white">
          {handout.title}
        </Link>
        <span>/</span>
        <span className="text-navy-100">Session</span>
      </nav>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            {handout.title}
          </h1>
          <span
            className={`rounded-pill px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
              live
                ? "bg-emerald-400/20 text-emerald-400"
                : "bg-salmon-400/15 text-salmon-300"
            }`}
          >
            {live ? "Live" : "Entwurf"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {live ? (
            <button
              onClick={onEnd}
              className="rounded-pill bg-salmon-400 px-4 py-2 text-sm font-medium text-white hover:bg-salmon-500"
            >
              Session beenden
            </button>
          ) : (
            <button
              onClick={onStart}
              disabled={starting}
              className="rounded-pill bg-teal-400 px-5 py-2 text-sm font-semibold text-navy-1000 shadow-sm shadow-teal-400/30 hover:bg-teal-300 disabled:opacity-60"
            >
              {starting ? "Starte …" : "Session starten"}
            </button>
          )}
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-pill border border-white/15 px-4 py-2 text-sm font-medium text-white hover:border-white/40 hover:bg-white/5"
          >
            Handout öffnen
          </a>
        </div>
      </div>
      <p className="mt-3 max-w-2xl text-sm text-navy-100">
        Folienstand, manuelle Blöcke, QR-Zugang und PowerPoint-Anbindung —
        alles von einer kompakten Session-Oberfläche aus steuern.
      </p>
    </header>
  );
}

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
    <div className="grid gap-3 sm:grid-cols-3">
      <StatCard label="Öffentlicher Link">
        <code className="block truncate font-mono text-sm">{publicUrl}</code>
      </StatCard>
      <StatCard label="Zuschauer">
        <p className="text-3xl font-semibold tracking-tight">
          {live ? audienceCount : 0}
        </p>
      </StatCard>
      <StatCard label="Sichtbare Blöcke">
        <p className="text-3xl font-semibold tracking-tight">
          {revealedCount}
          <span className="ml-2 text-base text-navy-400">
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
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="rounded-card border border-white/5 bg-navy-900 px-5 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
        {label}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

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
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
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
    <section className="rounded-card border border-white/5 bg-navy-900 p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-teal-300">
        Session-Steuerung
      </p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">
        Folien-Navigation
      </h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col items-center justify-center rounded-card border border-white/5 bg-navy-1000 px-4 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-navy-400">
            Aktuelle Folie
          </p>
          <p className="mt-1 text-5xl font-semibold tracking-tight text-white">
            {live ? currentSlide : "–"}
          </p>
          <p className="mt-1 text-xs text-navy-400">
            {live ? "Live übertragen" : "Session nicht aktiv"}
          </p>
        </div>
        <div className="rounded-card border border-white/5 bg-navy-1000 px-4 py-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-navy-400">
              Synchronisation
            </p>
            <span className="rounded-pill bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-navy-100">
              {syncMode}
            </span>
          </div>
          <p className="mt-1 text-base font-medium capitalize">{syncMode}</p>
          <div className="mt-3 flex gap-2">
            <input
              type="number"
              min={1}
              placeholder="Folie direkt setzen"
              value={slideJumpValue}
              onChange={(e) => setSlideJumpValue(e.target.value)}
              className="w-full rounded-pill border border-white/10 bg-navy-900 px-3 py-1.5 text-sm placeholder:text-navy-400 focus:border-teal-400"
            />
            <button
              onClick={onSlideJump}
              disabled={!live}
              className="rounded-pill border border-white/15 px-3 py-1.5 text-xs font-medium text-white hover:border-white/40 disabled:opacity-50"
            >
              Springen
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          onClick={onPrev}
          disabled={!live || currentSlide <= 1}
          className="rounded-pill border border-white/15 px-4 py-2.5 text-sm font-medium text-white hover:border-white/40 hover:bg-white/5 disabled:opacity-50"
        >
          Zurück
        </button>
        <button
          onClick={onNext}
          disabled={!live}
          className="rounded-pill bg-teal-400 px-4 py-2.5 text-sm font-semibold text-navy-1000 shadow-sm shadow-teal-400/30 hover:bg-teal-300 disabled:opacity-50"
        >
          Weiter
        </button>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-xs text-navy-400">Sync-Modus</p>
        <Segmented
          value={syncMode}
          onChange={onSyncMode}
          size="sm"
          options={[
            { value: "auto", label: "Auto-Sync" },
            { value: "hybrid", label: "Hybrid" },
            { value: "manual", label: "Manuell" },
          ]}
        />
        <p className="mt-2 text-xs text-navy-400">
          Auto: nur PowerPoint-Add-in löst aus · Hybrid: beides · Manuell:
          nur Reveal-Buttons hier.
        </p>
      </div>
    </section>
  );
}

function PowerPointCard({
  live,
}: {
  pairingCode?: string | null;
  live: boolean;
}): React.ReactElement {
  return (
    <section className="rounded-card border border-white/5 bg-navy-900 p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-teal-300">
        PowerPoint
      </p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">
        Add-in und Live-Verbindung
      </h2>
      <p className="mt-2 text-sm text-navy-100">
        Der Add-in läuft über dieselbe Web-App. Installieren, im Taskpane mit
        deinem Slide-Handout-Account anmelden — dann erscheint{" "}
        {live ? "diese Session" : "eine laufende Session"} direkt in der
        Auswahl. Folienwechsel werden automatisch gesendet.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <a
          href="/powerpoint-addin"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-pill bg-teal-400 px-4 py-2 text-xs font-semibold text-navy-1000 shadow-sm shadow-teal-400/30 hover:bg-teal-300"
        >
          Install-Seite
        </a>
        <a
          href="/powerpoint-addin/manifest.xml"
          download="slide-handout-addin.xml"
          className="rounded-pill border border-white/15 px-4 py-2 text-xs font-medium text-white hover:border-white/40 hover:bg-white/5"
        >
          Manifest herunterladen
        </a>
      </div>
    </section>
  );
}

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
    <section className="rounded-card border border-white/5 bg-navy-900 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Manuelle Reveals</h2>
        <p className="text-xs text-navy-400">
          {revealedSet.size}/{blocks.length} freigegeben
        </p>
      </div>
      {nextToReveal && live && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-card border border-teal-400/30 bg-teal-400/10 px-4 py-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-teal-300">
              Als nächstes
            </p>
            <p className="text-sm font-medium text-white">
              {nextToReveal.title}
            </p>
          </div>
          <button
            onClick={() => onReveal(nextToReveal._id)}
            className="rounded-pill bg-teal-400 px-4 py-2 text-xs font-semibold text-navy-1000 hover:bg-teal-300"
          >
            Reveal (Leertaste)
          </button>
        </div>
      )}
      <ul className="mt-4 space-y-2">
        {blocks.map((b) => {
          const revealed = revealedSet.has(b._id);
          return (
            <li
              key={b._id}
              className={`flex items-center justify-between gap-3 rounded-card border px-4 py-3 ${revealed ? "border-emerald-400/30 bg-emerald-400/5" : "border-white/5 bg-navy-1000"}`}
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{b.title}</p>
                <p className="mt-0.5 text-xs text-navy-400">
                  {b.trigger}
                  {b.trigger === "slide" && b.slideNumber
                    ? ` · Folie ${b.slideNumber}`
                    : ""}
                </p>
              </div>
              {revealed ? (
                <button
                  onClick={() => onUnreveal(b._id)}
                  disabled={!live}
                  className="rounded-pill border border-white/15 px-3 py-1.5 text-xs font-medium text-white hover:border-white/40 hover:bg-white/5 disabled:opacity-50"
                >
                  Verbergen
                </button>
              ) : (
                <button
                  onClick={() => onReveal(b._id)}
                  disabled={!live}
                  className="rounded-pill bg-teal-400 px-3 py-1.5 text-xs font-semibold text-navy-1000 hover:bg-teal-300 disabled:opacity-50"
                >
                  Reveal
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function PreviewTab({
  blocks,
  live,
}: {
  blocks: Block[];
  live: boolean;
}): React.ReactElement {
  if (!live) {
    return (
      <p className="rounded-card border border-dashed border-white/10 px-8 py-12 text-center text-navy-400">
        Vorschau zeigt, was das Publikum sieht — sobald die Session läuft.
      </p>
    );
  }
  if (blocks.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-white/10 px-8 py-12 text-center text-navy-400">
        Noch keine Blöcke sichtbar.
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {blocks.map((b) => (
        <BlockRenderer key={b._id} block={b} />
      ))}
    </div>
  );
}
