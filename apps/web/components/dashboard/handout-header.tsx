"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Id } from "@convex/_generated/dataModel";
import { Input } from "#/components/ui/input";
import { Button } from "#/components/ui/button";
import { EditIcon, TrashIcon, CheckIcon } from "#/components/ui/icon";

/**
 * Editierbarer Kopf der Handout-Editor-Seite. Titel + Beschreibung inline
 * bearbeiten; Löschen navigiert zurück zur Liste.
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
  void publicUrl;
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [saving, setSaving] = useState(false);

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

  if (editing) {
    return (
      <div className="space-y-3">
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

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{initialTitle}</h1>
        <p className="mt-1 text-sm text-navy-700 dark:text-navy-100">
          {initialDescription || "—"}
        </p>
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          title="Umbenennen"
          aria-label="Umbenennen"
          className="rounded-pill p-1.5 text-navy-400 hover:text-teal-500"
        >
          <EditIcon />
        </button>
        <button
          type="button"
          onClick={remove}
          title="Löschen"
          aria-label="Handout löschen"
          className="rounded-pill p-1.5 text-navy-400 hover:text-red-500"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}
