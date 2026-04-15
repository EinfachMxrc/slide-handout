"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Card } from "#/components/ui/card";
import { Button } from "#/components/ui/button";
import { EyeIcon, EyeOffIcon, PlayIcon } from "#/components/ui/icon";

interface Block {
  _id: Id<"blocks">;
  rank: string;
  title: string;
  notes?: string;
  trigger: "slide" | "always" | "manual";
  slideNumber?: number;
}

export function RevealTrigger({
  handoutId,
  blocks,
}: {
  handoutId: Id<"handouts">;
  blocks: Block[];
}): React.ReactElement {
  const [sessionId, setSessionId] = useState<Id<"presenterSessions"> | null>(
    null,
  );
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. Start session on mount (only once).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/presenter-sessions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handoutId }),
      });
      if (!res.ok) {
        setError("Konnte Sitzung nicht starten.");
        return;
      }
      const data = (await res.json()) as {
        id: string;
        pairingCode?: string;
      };
      if (!cancelled) {
        setSessionId(data.id as Id<"presenterSessions">);
        if (data.pairingCode) setPairingCode(data.pairingCode);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [handoutId]);

  // 2. Live reveal-status + audience count.
  const reveals = useQuery(
    api.reveals.streamForSession,
    sessionId ? { presenterSessionId: sessionId } : "skip",
  );
  const audienceCount = useQuery(
    api.audience.countForSession,
    sessionId ? { presenterSessionId: sessionId } : "skip",
  );
  const revealedSet = useMemo(
    () => new Set(reveals?.items.map((r) => r.blockId) ?? []),
    [reveals],
  );

  // Blocks excluding `always` (those are always visible, no reveal needed).
  const sortedBlocks = useMemo(
    () =>
      [...blocks]
        .filter((b) => b.trigger !== "always")
        .sort((a, b) => a.rank.localeCompare(b.rank)),
    [blocks],
  );

  const nextToReveal = useMemo(
    () => sortedBlocks.find((b) => !revealedSet.has(b._id)),
    [sortedBlocks, revealedSet],
  );
  const lastRevealedId = useMemo(() => {
    // Walk reveals array (chronological) and find the last whose block
    // still exists in sortedBlocks.
    if (!reveals) return null;
    const items = reveals.items;
    for (let i = items.length - 1; i >= 0; i--) {
      const id = items[i]!.blockId;
      if (sortedBlocks.some((b) => b._id === id)) return id;
    }
    return null;
  }, [reveals, sortedBlocks]);

  const reveal = useCallback(
    async (blockId: Id<"blocks">) => {
      if (!sessionId) return;
      const res = await fetch(`/api/reveals`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ presenterSessionId: sessionId, blockId }),
      });
      if (!res.ok) setError("Reveal fehlgeschlagen.");
    },
    [sessionId],
  );

  const unreveal = useCallback(
    async (blockId: Id<"blocks">) => {
      if (!sessionId) return;
      await fetch(`/api/reveals/single`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ presenterSessionId: sessionId, blockId }),
      });
    },
    [sessionId],
  );

  const revealNext = useCallback(async () => {
    if (nextToReveal) await reveal(nextToReveal._id);
  }, [nextToReveal, reveal]);

  const unrevealLast = useCallback(async () => {
    if (lastRevealedId) await unreveal(lastRevealedId);
  }, [lastRevealedId, unreveal]);

  async function bulk(action: "all" | "none"): Promise<void> {
    if (!sessionId) return;
    if (action === "none" && !confirm("Alle Reveals zurücksetzen?")) return;
    await fetch(`/api/reveals/bulk`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ presenterSessionId: sessionId, action }),
    });
  }

  async function endSession(): Promise<void> {
    if (!sessionId) return;
    if (!confirm("Sitzung beenden?")) return;
    await fetch(`/api/presenter-sessions/${sessionId}`, { method: "DELETE" });
    setSessionId(null);
  }

  // 3. Keyboard shortcuts.
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === " " || e.key === "ArrowRight") {
        if (e.shiftKey || e.key === "ArrowRight" && e.shiftKey) return;
        e.preventDefault();
        void revealNext();
      } else if (
        (e.key === " " && e.shiftKey) ||
        e.key === "ArrowLeft" ||
        e.key === "Backspace"
      ) {
        e.preventDefault();
        void unrevealLast();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealNext, unrevealLast]);

  if (error) {
    return (
      <Card className="mt-6 border-red-300">
        <p className="text-sm text-red-500">{error}</p>
      </Card>
    );
  }

  if (!sessionId) {
    return (
      <Card className="mt-6">
        <p className="text-sm text-navy-400">Sitzung wird gestartet …</p>
      </Card>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {pairingCode && (
        <Card className="border-teal-400/50 bg-teal-50 dark:bg-navy-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-teal-500">
                PowerPoint-Add-in · Pairing-Code
              </p>
              <p className="mt-1 font-mono text-3xl font-semibold tracking-[0.3em]">
                {pairingCode.slice(0, 3)} {pairingCode.slice(3)}
              </p>
              <p className="mt-1 text-xs text-navy-400">
                Im Add-in eingeben, damit PowerPoint die aktuelle Folie an
                diese Sitzung sendet.
              </p>
            </div>
            <div className="flex flex-col gap-2 text-xs">
              <a
                href="/powerpoint-addin/manifest.xml"
                download="slide-handout-addin.xml"
                className="rounded-pill bg-salmon-400 px-3 py-1.5 font-medium text-white hover:bg-salmon-500"
              >
                manifest.xml herunterladen
              </a>
              <a
                href="/powerpoint-addin"
                className="text-center text-navy-400 hover:text-teal-500"
              >
                Install-Anleitung
              </a>
            </div>
          </div>
        </Card>
      )}

      {/* Big "reveal next" button — the primary action during a talk. */}
      {nextToReveal ? (
        <Card className="border-salmon-400/50 bg-salmon-400/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-salmon-400">
                Als nächstes
              </p>
              <p className="mt-0.5 text-sm font-semibold">
                {nextToReveal.title}
              </p>
            </div>
            <button
              type="button"
              onClick={revealNext}
              className="inline-flex items-center gap-2 rounded-pill bg-salmon-400 px-5 py-2.5 text-sm font-semibold text-white hover:bg-salmon-500"
            >
              <PlayIcon /> Reveal (Leertaste)
            </button>
          </div>
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-navy-400">
            Alle manuellen/Folien-Blöcke sind freigegeben ✓
          </p>
        </Card>
      )}

      {/* Stats + bulk controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 text-navy-400">
          <span>
            {revealedSet.size}/{sortedBlocks.length} freigegeben
          </span>
          <span className="inline-flex items-center gap-1">
            <span
              className={`h-2 w-2 rounded-full ${audienceCount && audienceCount > 0 ? "animate-pulse bg-teal-400" : "bg-navy-400"}`}
            />
            {audienceCount ?? 0} Zuhörer live
          </span>
          <span className="hidden sm:inline">
            ⏎ Leertaste: nächster · ← / ⇧Leertaste: zurück
          </span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => bulk("all")}>
            <EyeIcon /> Alle zeigen
          </Button>
          <Button size="sm" variant="ghost" onClick={() => bulk("none")}>
            <EyeOffIcon /> Zurücksetzen
          </Button>
          <Button size="sm" variant="ghost" onClick={endSession}>
            Sitzung beenden
          </Button>
        </div>
      </div>

      {/* Per-block list with individual reveal toggles */}
      <ul className="space-y-2">
        {sortedBlocks.map((b) => {
          const revealed = revealedSet.has(b._id);
          return (
            <li key={b._id}>
              <Card
                className={
                  revealed
                    ? "border-teal-400/60"
                    : "border-navy-100 dark:border-navy-700"
                }
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{b.title}</p>
                    <p className="mt-0.5 text-xs text-navy-400">
                      {b.trigger}
                      {b.trigger === "slide" && b.slideNumber
                        ? ` · Folie ${b.slideNumber}`
                        : ""}
                    </p>
                    {b.notes && (
                      <p className="mt-2 whitespace-pre-wrap rounded border-l-2 border-teal-400/60 bg-teal-50/40 px-2 py-1 text-xs italic text-navy-600 dark:bg-teal-950/20 dark:text-navy-300">
                        {b.notes}
                      </p>
                    )}
                  </div>
                  {revealed ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => unreveal(b._id)}
                    >
                      <EyeOffIcon /> Verbergen
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => reveal(b._id)}>
                      Reveal
                    </Button>
                  )}
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
