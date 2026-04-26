"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Id } from "@convex/_generated/dataModel";
import { Input } from "#/components/ui/input";
import { Button } from "#/components/ui/button";
import { EditIcon, TrashIcon, CheckIcon } from "#/components/ui/icon";

/**
 * HandoutHeader — editorialer Kopf der Handout-Editor-Seite. Eyebrow + Titel
 * + Beschreibung, darunter ein kopierbarer Public-Link-Chip. Umbenennen &
 * Löschen sind als dezente Icon-Buttons rechts. Im Edit-Zustand wird das
 * Ganze durch ein Inline-Form ersetzt.
 */
export function HandoutHeader({
  handoutId,
  initialTitle,
  initialDescription,
  publicUrl,
}: {
  handoutId: Id<"handouts">;
  initialTitle: string;
  initialDescription: string;
  publicUrl: string;
}): React.ReactElement {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  async function save(): Promise<void> {
    setSaving(true);
    try {
      const res = await fetch(`/api/handouts/${handoutId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      if (res.ok) {
        setEditing(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(): Promise<void> {
    if (
      !confirm(
        `Handout „${initialTitle}" mit allen Blöcken und Sitzungen löschen?`,
      )
    )
      return;
    const res = await fetch(`/api/handouts/${handoutId}`, { method: "DELETE" });
    if (res.ok) router.replace("/handouts");
  }

  async function copyLink(): Promise<void> {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore — clipboard requires secure context */
    }
  }

  if (editing) {
    return (
      <div className="space-y-4 rounded-card border border-white/10 bg-navy-900 p-6">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titel"
        />
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beschreibung"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={saving}>
            <CheckIcon />
            {saving ? "Speichern …" : "Speichern"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Abbrechen
          </Button>
        </div>
      </div>
    );
  }

  const shownUrl = publicUrl ? publicUrl.replace(/^https?:\/\//, "") : "";

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-navy-400">
          <span aria-hidden className="inline-block h-px w-5 bg-white/20" />
          Handout
        </span>
        <h1 className="mt-3 font-display text-3xl leading-tight tracking-tight text-white sm:text-4xl">
          {initialTitle}
        </h1>
        {initialDescription ? (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-navy-100">
            {initialDescription}
          </p>
        ) : (
          <p className="mt-2 text-sm italic text-navy-400">
            Noch keine Beschreibung.
          </p>
        )}
        {shownUrl ? (
          <button
            type="button"
            onClick={copyLink}
            aria-label={copied ? "Link kopiert" : "Öffentlichen Link kopieren"}
            className="mt-4 inline-flex items-center gap-2 rounded-pill border border-white/10 bg-navy-900 px-3 py-1.5 font-mono text-[11px] text-navy-100 transition hover:border-white/25 hover:text-white"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <span>{copied ? "Kopiert!" : shownUrl}</span>
          </button>
        ) : null}
      </div>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          title="Umbenennen"
          aria-label="Umbenennen"
          className="rounded-pill p-2 text-navy-400 transition hover:bg-white/5 hover:text-teal-300"
        >
          <EditIcon />
        </button>
        <button
          type="button"
          onClick={remove}
          title="Löschen"
          aria-label="Handout löschen"
          className="rounded-pill p-2 text-navy-400 transition hover:bg-salmon-500/10 hover:text-salmon-300"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}
