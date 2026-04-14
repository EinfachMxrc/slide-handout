"use client";

import { useState } from "react";
import type { Id } from "@convex/_generated/dataModel";
import { Card } from "#/components/ui/card";
import { Input, Textarea } from "#/components/ui/input";
import { Button } from "#/components/ui/button";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  DuplicateIcon,
  EditIcon,
  TrashIcon,
} from "#/components/ui/icon";
import { MarkdownPreview } from "./markdown-preview";

interface ServerBlock {
  _id: Id<"blocks">;
  rank: string;
  title: string;
  markdown: string;
  trigger: "slide" | "always" | "manual";
  slideNumber?: number;
  layout: "default" | "centered" | "wide" | "compact" | "terminal";
  imagePosition: "top" | "bottom" | "left" | "right" | "full" | "background";
  fontSize: "sm" | "base" | "lg" | "xl";
  imageUrl?: string;
  imageCaption?: string;
  terminalVariant?: "neutral" | "success" | "danger";
  terminalLabel?: string;
}

type Layout = ServerBlock["layout"];
type ImagePos = ServerBlock["imagePosition"];
type FontSize = ServerBlock["fontSize"];

const triggerLabel: Record<ServerBlock["trigger"], string> = {
  manual: "Manuell",
  slide: "An Folie",
  always: "Immer sichtbar",
};

export function BlockEditor({
  handoutId,
  initialBlocks,
}: {
  handoutId: Id<"handouts">;
  initialBlocks: ServerBlock[];
}): React.ReactElement {
  const [blocks, setBlocks] = useState(
    [...initialBlocks].sort((a, b) => a.rank.localeCompare(b.rank)),
  );
  const [editingId, setEditingId] = useState<Id<"blocks"> | null>(null);
  const [pending, setPending] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [draft, setDraft] = useState({
    title: "",
    markdown: "",
    trigger: "manual" as ServerBlock["trigger"],
    slideNumber: "" as string,
  });

  async function refresh(): Promise<void> {
    const res = await fetch(`/api/blocks?handoutId=${handoutId}`);
    if (res.ok) {
      const data = (await res.json()) as ServerBlock[];
      setBlocks([...data].sort((a, b) => a.rank.localeCompare(b.rank)));
    }
  }

  async function addBlock(): Promise<void> {
    if (!draft.title.trim()) return;
    setPending(true);
    try {
      const res = await fetch("/api/blocks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          handoutId,
          title: draft.title,
          markdown: draft.markdown,
          trigger: draft.trigger,
          slideNumber: draft.slideNumber
            ? Number(draft.slideNumber)
            : undefined,
          layout: "default",
          imagePosition: "top",
          fontSize: "base",
        }),
      });
      if (res.ok) {
        setDraft({ title: "", markdown: "", trigger: "manual", slideNumber: "" });
        await refresh();
      }
    } finally {
      setPending(false);
    }
  }

  async function updateBlock(
    id: Id<"blocks">,
    patch: Partial<ServerBlock>,
  ): Promise<void> {
    const res = await fetch(`/api/blocks/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) await refresh();
  }

  async function removeBlock(id: Id<"blocks">): Promise<void> {
    if (!confirm("Block löschen?")) return;
    const res = await fetch(`/api/blocks/${id}`, { method: "DELETE" });
    if (res.ok) await refresh();
  }

  async function duplicateBlock(id: Id<"blocks">): Promise<void> {
    const res = await fetch(`/api/blocks/${id}/duplicate`, { method: "POST" });
    if (res.ok) await refresh();
  }

  async function move(index: number, dir: -1 | 1): Promise<void> {
    const target = index + dir;
    if (target < 0 || target >= blocks.length) return;
    const block = blocks[index]!;
    // Swap with the neighbour: new position lies between the block on
    // either side of the target position.
    const prev = dir === -1 ? blocks[target - 1] ?? null : blocks[target];
    const next = dir === -1 ? blocks[target] : blocks[target + 1] ?? null;
    await fetch("/api/blocks/reorder", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: block._id,
        prevRank: prev?.rank ?? null,
        nextRank: next?.rank ?? null,
      }),
    });
    await refresh();
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Blöcke</h2>
        <span className="text-xs text-navy-400">
          {blocks.length} Block{blocks.length === 1 ? "" : "s"}
        </span>
      </div>

      <ul className="space-y-3">
        {blocks.map((b, i) => (
          <li key={b._id}>
            {editingId === b._id ? (
              <BlockEditForm
                block={b}
                onSave={async (patch) => {
                  await updateBlock(b._id, patch);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <Card>
                <div className="flex items-start gap-3">
                  <div className="flex flex-col gap-0.5 pt-0.5 text-navy-400">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      title="Nach oben"
                      className="rounded p-1 hover:bg-navy-100 disabled:opacity-30 dark:hover:bg-navy-800"
                    >
                      <ChevronUpIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === blocks.length - 1}
                      title="Nach unten"
                      className="rounded p-1 hover:bg-navy-100 disabled:opacity-30 dark:hover:bg-navy-800"
                    >
                      <ChevronDownIcon />
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{b.title}</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-navy-400">
                      <span className="rounded bg-navy-100 px-2 py-0.5 dark:bg-navy-800">
                        {triggerLabel[b.trigger]}
                        {b.trigger === "slide" && b.slideNumber
                          ? ` · Folie ${b.slideNumber}`
                          : ""}
                      </span>
                    </div>
                    {b.markdown && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-xs text-navy-400 hover:text-teal-500">
                          Inhalt anzeigen
                        </summary>
                        <div className="mt-3 rounded-card bg-navy-50 p-4 dark:bg-navy-800">
                          <MarkdownPreview source={b.markdown} />
                        </div>
                      </details>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <IconButton
                      title="Bearbeiten"
                      onClick={() => setEditingId(b._id)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      title="Duplizieren"
                      onClick={() => duplicateBlock(b._id)}
                    >
                      <DuplicateIcon />
                    </IconButton>
                    <IconButton
                      title="Löschen"
                      onClick={() => removeBlock(b._id)}
                      danger
                    >
                      <TrashIcon />
                    </IconButton>
                  </div>
                </div>
              </Card>
            )}
          </li>
        ))}
      </ul>

      <Card className="mt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Neuen Block anlegen</h3>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="text-xs text-navy-400 hover:text-teal-500"
          >
            {showPreview ? "Vorschau ausblenden" : "Vorschau einblenden"}
          </button>
        </div>

        <div className="mt-3 space-y-3">
          <Input
            placeholder="Titel"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />

          <div
            className={
              showPreview
                ? "grid gap-3 md:grid-cols-2"
                : "grid grid-cols-1 gap-3"
            }
          >
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-navy-400">
                Markdown
              </label>
              <Textarea
                rows={showPreview ? 14 : 8}
                placeholder="# Überschrift&#10;&#10;Dein **Markdown** hier. Unterstützt GFM (Tabellen, Checklisten), Code-Blöcke mit Syntax-Highlight über Terminal-Style."
                value={draft.markdown}
                onChange={(e) =>
                  setDraft({ ...draft, markdown: e.target.value })
                }
              />
            </div>
            {showPreview && (
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-navy-400">
                  Vorschau (live)
                </label>
                <div className="min-h-[calc(14rem+2px)] rounded-card border border-navy-100 bg-white p-4 dark:border-navy-700 dark:bg-navy-950">
                  <MarkdownPreview source={draft.markdown} />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <select
              value={draft.trigger}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  trigger: e.target.value as ServerBlock["trigger"],
                })
              }
              className="rounded-card border border-navy-100 bg-white px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-900"
            >
              <option value="manual">Manuell</option>
              <option value="slide">An Folie binden</option>
              <option value="always">Immer sichtbar</option>
            </select>
            {draft.trigger === "slide" && (
              <Input
                type="number"
                min={1}
                placeholder="Folien-Nr."
                value={draft.slideNumber}
                onChange={(e) =>
                  setDraft({ ...draft, slideNumber: e.target.value })
                }
                className="w-32"
              />
            )}
          </div>
          <Button onClick={addBlock} disabled={pending}>
            {pending ? "Anlegen …" : "Block anlegen"}
          </Button>
        </div>
      </Card>
    </section>
  );
}

function IconButton({
  children,
  onClick,
  title,
  danger = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`rounded-pill border border-transparent p-2 text-sm hover:border-navy-100 dark:hover:border-navy-700 ${danger ? "text-red-500" : "text-navy-700 dark:text-navy-100"}`}
    >
      {children}
    </button>
  );
}

function BlockEditForm({
  block,
  onSave,
  onCancel,
}: {
  block: ServerBlock;
  onSave: (patch: Partial<ServerBlock>) => Promise<void>;
  onCancel: () => void;
}): React.ReactElement {
  const [title, setTitle] = useState(block.title);
  const [markdown, setMarkdown] = useState(block.markdown);
  const [trigger, setTrigger] = useState(block.trigger);
  const [slideNumber, setSlideNumber] = useState(
    block.slideNumber ? String(block.slideNumber) : "",
  );
  const [layout, setLayout] = useState<Layout>(block.layout);
  const [fontSize, setFontSize] = useState<FontSize>(block.fontSize);
  const [imageUrl, setImageUrl] = useState(block.imageUrl ?? "");
  const [imagePosition, setImagePosition] = useState<ImagePos>(
    block.imagePosition,
  );
  const [imageCaption, setImageCaption] = useState(block.imageCaption ?? "");
  const [terminalVariant, setTerminalVariant] = useState<
    NonNullable<ServerBlock["terminalVariant"]>
  >(block.terminalVariant ?? "neutral");
  const [terminalLabel, setTerminalLabel] = useState(
    block.terminalLabel ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showAppearance, setShowAppearance] = useState(
    block.layout === "terminal",
  );

  async function submit(): Promise<void> {
    setSaving(true);
    try {
      await onSave({
        title,
        markdown,
        trigger,
        slideNumber: slideNumber ? Number(slideNumber) : undefined,
        layout,
        fontSize,
        imagePosition,
        imageUrl: imageUrl.trim() || undefined,
        imageCaption: imageCaption.trim() || undefined,
        terminalVariant: layout === "terminal" ? terminalVariant : undefined,
        terminalLabel:
          layout === "terminal" ? terminalLabel.trim() || undefined : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-teal-400/50">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Block bearbeiten</h4>
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className="text-xs text-navy-400 hover:text-teal-500"
        >
          {showPreview ? "Vorschau ausblenden" : "Vorschau einblenden"}
        </button>
      </div>
      <div className="mt-3 space-y-3">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        <div
          className={
            showPreview ? "grid gap-3 md:grid-cols-2" : "grid grid-cols-1 gap-3"
          }
        >
          <Textarea
            rows={12}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
          />
          {showPreview && (
            <div className="min-h-[calc(12rem+2px)] rounded-card border border-navy-100 bg-white p-4 dark:border-navy-700 dark:bg-navy-950">
              <MarkdownPreview source={markdown} />
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <select
            value={trigger}
            onChange={(e) =>
              setTrigger(e.target.value as typeof block.trigger)
            }
            className="rounded-card border border-navy-100 bg-white px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-900"
          >
            <option value="manual">Manuell</option>
            <option value="slide">An Folie</option>
            <option value="always">Immer sichtbar</option>
          </select>
          {trigger === "slide" && (
            <Input
              type="number"
              min={1}
              value={slideNumber}
              onChange={(e) => setSlideNumber(e.target.value)}
              className="w-32"
            />
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowAppearance((v) => !v)}
          className="flex w-full items-center justify-between rounded-card border border-dashed border-navy-100 px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-navy-400 hover:border-teal-400 dark:border-navy-700"
        >
          Darstellung &amp; Bild
          <span
            className="text-base transition-transform"
            style={{ transform: showAppearance ? "rotate(90deg)" : "rotate(0)" }}
          >
            ›
          </span>
        </button>

        {showAppearance && (
          <div className="grid gap-3 md:grid-cols-2">
            <SelectField
              label="Layout"
              value={layout}
              onChange={(x) => setLayout(x as Layout)}
              options={[
                { value: "default", label: "Standard" },
                { value: "centered", label: "Zentriert" },
                { value: "wide", label: "Breit (ohne prose-max)" },
                { value: "compact", label: "Kompakt" },
                { value: "terminal", label: "Terminal (Tipp-Animation)" },
              ]}
            />
            <SelectField
              label="Schriftgröße"
              value={fontSize}
              onChange={(x) => setFontSize(x as FontSize)}
              options={[
                { value: "sm", label: "Klein" },
                { value: "base", label: "Normal" },
                { value: "lg", label: "Groß" },
                { value: "xl", label: "Sehr groß" },
              ]}
            />
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-navy-400">
                Bild-URL (https)
              </label>
              <Input
                type="url"
                placeholder="https://…"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
            <SelectField
              label="Bildposition"
              value={imagePosition}
              onChange={(x) => setImagePosition(x as ImagePos)}
              options={[
                { value: "top", label: "Oberhalb" },
                { value: "bottom", label: "Unterhalb" },
                { value: "left", label: "Links (Seite)" },
                { value: "right", label: "Rechts (Seite)" },
                { value: "full", label: "Volle Breite (edge-to-edge)" },
                { value: "background", label: "Hintergrund (mit Overlay)" },
              ]}
            />
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-navy-400">
                Bildunterschrift
              </label>
              <Input
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                placeholder="Optional"
              />
            </div>

            {layout === "terminal" && (
              <>
                <SelectField
                  label="Terminal-Variante"
                  value={terminalVariant}
                  onChange={(x) =>
                    setTerminalVariant(
                      x as NonNullable<ServerBlock["terminalVariant"]>,
                    )
                  }
                  options={[
                    { value: "neutral", label: "Neutral ($)" },
                    { value: "success", label: "Erfolg / sicher (✓)" },
                    { value: "danger", label: "Warnung / unsicher (✗)" },
                  ]}
                />
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-navy-400">
                    Terminal-Header (optional)
                  </label>
                  <Input
                    value={terminalLabel}
                    onChange={(e) => setTerminalLabel(e.target.value)}
                    placeholder={
                      terminalVariant === "danger"
                        ? "z. B. UNSICHER · String-Verkettung"
                        : terminalVariant === "success"
                          ? "z. B. SICHER · Prepared Statement"
                          : "z. B. app.py"
                    }
                  />
                </div>
                <p className="text-xs text-navy-400 md:col-span-2">
                  Im Terminal-Layout wird der Markdown-Inhalt als reine
                  Mono-Zeile-für-Zeile getippt — ideal für Code-Snippets
                  oder Vergleiche (zwei Blöcke nebeneinander mit
                  „SICHER" und „UNSICHER").
                </p>
              </>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={submit} disabled={saving}>
            {saving ? "Speichern …" : "Speichern"}
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Abbrechen
          </Button>
        </div>
      </div>
    </Card>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}): React.ReactElement {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-navy-400">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-card border border-navy-100 bg-white px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-900"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
