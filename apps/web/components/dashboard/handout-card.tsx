"use client";

import Link from "next/link";
import { useState } from "react";
import type { Id } from "@convex/_generated/dataModel";

interface Handout {
  _id: Id<"handouts">;
  title: string;
  description: string;
  publicToken: string;
  createdAt?: number;
  updatedAt?: number;
}

/** Kompaktes Time-Ago, deutsch formatiert. */
function timeAgo(n?: number): string {
  if (!n) return "—";
  const diff = Date.now() - n;
  const min = Math.round(diff / 60000);
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `vor ${h} h`;
  const d = Math.round(h / 24);
  if (d < 7) return `vor ${d} d`;
  return new Date(n).toLocaleDateString("de-DE");
}

/** Initialen aus Titel für das Thumb. */
function initialLetters(s: string): string {
  const words = s.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "H";
  if (words.length === 1) {
    const w = words[0] ?? "";
    return w.slice(0, 2).toUpperCase();
  }
  const a = words[0]?.[0] ?? "";
  const b = words[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

/**
 * HandoutCard — editoriale Karte mit abstraktem Thumb (Initialen + Token),
 * Titel, 2-Zeilen-Beschreibung, time-ago-Metadatum und Action-Row.
 */
export function HandoutCard({
  handout,
  onChanged,
}: {
  handout: Handout;
  siteUrl?: string;
  onChanged: () => Promise<void>;
}): React.ReactElement {
  const [pending, setPending] = useState(false);

  async function remove(): Promise<void> {
    if (!confirm(`Handout „${handout.title}" wirklich löschen?`)) return;
    setPending(true);
    try {
      const res = await fetch(`/api/handouts/${handout._id}`, {
        method: "DELETE",
      });
      if (res.ok) await onChanged();
    } finally {
      setPending(false);
    }
  }

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-card border border-white/5 bg-navy-900 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/15 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]">
      {/* Thumb — abstrakter Gradient, Initialen + Token-Snippet */}
      <Link
        href={`/handouts/${handout._id}`}
        aria-label={`Handout „${handout.title}" bearbeiten`}
        className="relative block aspect-[16/7] overflow-hidden border-b border-white/5 bg-gradient-to-br from-navy-850 to-navy-950"
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 70% at 30% 40%, rgba(94,234,212,0.14), transparent 65%), radial-gradient(ellipse 70% 80% at 80% 70%, rgba(244,163,146,0.09), transparent 68%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.035] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,black,transparent)]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-between px-6">
          <span className="font-display text-3xl italic leading-none text-white/70 transition group-hover:text-white">
            {initialLetters(handout.title)}
          </span>
          <span className="rounded-pill border border-white/10 bg-navy-950/60 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-navy-100 backdrop-blur-sm">
            /{handout.publicToken.slice(0, 6)}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col px-5 py-5">
        <Link
          href={`/handouts/${handout._id}`}
          className="text-base font-semibold leading-snug tracking-tight text-white transition group-hover:text-teal-300"
        >
          {handout.title}
        </Link>
        <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-navy-100">
          {handout.description || (
            <span className="italic text-navy-400">Keine Beschreibung</span>
          )}
        </p>
        <p className="mt-4 text-[10px] uppercase tracking-[0.14em] text-navy-400">
          Zuletzt geändert · {timeAgo(handout.updatedAt ?? handout.createdAt)}
        </p>
        <div className="mt-5 flex items-center gap-2 border-t border-white/5 pt-4">
          <Link
            href={`/handouts/${handout._id}`}
            className="inline-flex items-center gap-1 rounded-pill bg-teal-400 px-3 py-1.5 text-xs font-semibold text-navy-1000 transition hover:bg-teal-300"
          >
            Bearbeiten
          </Link>
          <Link
            href={`/handouts/${handout._id}/present`}
            className="inline-flex items-center gap-1 rounded-pill border border-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:border-white/25 hover:bg-white/5"
          >
            Session <span aria-hidden>→</span>
          </Link>
          <div className="ml-auto">
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              aria-label={`Handout „${handout.title}" löschen`}
              className="rounded-pill p-1.5 text-navy-400 transition hover:bg-salmon-500/10 hover:text-salmon-300 disabled:opacity-50"
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
