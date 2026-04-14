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

function fmtDate(n?: number): string {
  if (!n) return "";
  return new Date(n).toLocaleDateString("de-DE");
}

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
    <article className="flex h-full flex-col rounded-card border border-white/5 bg-navy-900 p-6">
      <div className="flex-1">
        <Link
          href={`/handouts/${handout._id}`}
          className="block text-base font-semibold text-white hover:text-teal-300"
        >
          {handout.title}
        </Link>
        <p className="mt-2 line-clamp-2 text-sm text-navy-100">
          {handout.description || (
            <span className="italic text-navy-400">Keine Beschreibung</span>
          )}
        </p>
        <p className="mt-4 text-xs text-navy-400">
          {fmtDate(handout.updatedAt ?? handout.createdAt)}
        </p>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={`/handouts/${handout._id}`}
          className="rounded-pill bg-teal-400 px-4 py-2 text-xs font-semibold text-navy-1000 shadow-sm shadow-teal-400/30 hover:bg-teal-300"
        >
          Bearbeiten
        </Link>
        <Link
          href={`/handouts/${handout._id}/present`}
          className="rounded-pill border border-white/15 px-4 py-2 text-xs font-medium text-white hover:border-white/40 hover:bg-white/5"
        >
          Session
        </Link>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="rounded-pill bg-salmon-400 px-4 py-2 text-xs font-medium text-white hover:bg-salmon-500 disabled:opacity-50"
        >
          Löschen
        </button>
      </div>
    </article>
  );
}
