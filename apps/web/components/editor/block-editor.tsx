"use client";

import { useState } from "react";
import type { Id } from "@convex/_generated/dataModel";
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
  notes?: string;
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

const triggerTone: Record<ServerBlock["trigger"], string> = {
  manual: "text-white/65 bg-white/[0.06] border-white/10",
  slide: "text-teal-300 bg-teal-400/10 border-teal-400/25",
  always: "text-salmon-300 bg-salmon-400/10 border-salmon-400/25",
};

/* Editorial dark-glass form primitives — keep at module scope for reuse. */
const fieldLabel =
  "mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-white/60";
const pillInput =
  "w-full rounded-pill border border-white/10 bg-navy-950/70 px-4 py-2.5 text-sm text-white placeholder:text-white/30 transition-[border-color,box-shadow] focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-400/20";
const cardTextarea =
  "w-full rounded-card border border-white/10 bg-navy-950/70 px-4 py-3 font-mono text-sm leading-relaxed text-white placeholder:text-white/30 transition-[border-color,box-shadow] focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-400/20";
const pillSelect =
  "w-full appearance-none rounded-pill border border-white/10 bg-navy-950/70 px-4 py-2.5 pr-10 text-sm text-white transition-[border-color,box-shadow] focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-400/20";
const tealButton =
  "inline-flex items-center gap-2 rounded-pill bg-teal-400 px-5 py-2.5 text-sm font-semibold text-navy-1000 shadow-[0_10px_30px_-10px_rgba(94,234,212,0.65)] transition hover:bg-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-400/30 disabled:cursor-not-allowed disabled:bg-teal-400/50";
const ghostButton =
  "inline-flex items-center gap-2 rounded-pill border border-white/15 px-5 py-2.5 text-sm font-medium text-white/75 transition hover:border-white/30 hover:text-white";

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
    <section className="space-y-6">
      {/* Section-Header */}
      <header className="flex items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-teal-300/80">
            Inhalte
          </p>
          <h2 className="mt-2 font-display text-2xl italic leading-tight text-white">
            Blöcke
          </h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-pill border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
          {blocks.length === 0
            ? "leer"
            : `${blocks.length} Block${blocks.length === 1 ? "" : "s"}`}
        </span>
      </header>

      {/* Block-Liste */}
      {blocks.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
          <p className="text-sm text-white/60">
            Noch keine Blöcke. Lege unten den ersten an — Titel +{" "}
            <span className="font-mono text-teal-300">Markdown</span> genügen.
          </p>
        </div>
      ) : (
        <ol className="space-y-3">
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
                <article className="group relative overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.05]">
                  <div className="flex items-start gap-4">
                    {/* Reorder-Rail */}
                    <div className="flex flex-col items-center gap-1 pt-0.5">
                      <button
                        type="button"
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        title="Nach oben"
                        aria-label="Nach oben"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-pill text-white/50 transition hover:bg-white/5 hover:text-teal-300 disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-white/50"
                      >
                        <ChevronUpIcon />
                      </button>
                      <span
                        aria-hidden
                        className="font-mono text-[10px] text-white/30"
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <button
                        type="button"
                        onClick={() => move(i, 1)}
                        disabled={i === blocks.length - 1}
                        title="Nach unten"
                        aria-label="Nach unten"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-pill text-white/50 transition hover:bg-white/5 hover:text-teal-300 disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-white/50"
                      >
                        <ChevronDownIcon />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-lg italic leading-tight text-white">
                        {b.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 font-medium uppercase tracking-[0.14em] ${triggerTone[b.trigger]}`}
                        >
                          <span
                            aria-hidden
                            className="inline-block h-1 w-1 rounded-full bg-current"
                          />
                          {triggerLabel[b.trigger]}
                          {b.trigger === "slide" && b.slideNumber
                            ? ` · Folie ${b.slideNumber}`
                            : ""}
                        </span>
                        {b.layout !== "default" && (
                          <span className="inline-flex items-center gap-1 rounded-pill border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/55">
                            {b.layout === "terminal" ? "Terminal" : b.layout}
                          </span>
                        )}
                      </div>

                      {b.markdown && (
                        <details className="group/preview mt-4">
                          <summary className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white/45 transition hover:text-teal-300">
                            <span
                              aria-hidden
                              className="inline-block transition-transform group-open/preview:rotate-90"
                            >
                              ›
                            </span>
                            Inhalt anzeigen
                          </summary>
                          <div className="mt-3 rounded-card border border-white/5 bg-navy-950/60 p-4">
                            <MarkdownPreview source={b.markdown} />
                          </div>
                        </details>
                      )}
                    </div>

                    {/* Aktionen */}
                    <div className="flex flex-col gap-1 opacity-70 transition group-hover:opacity-100 sm:flex-row">
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
                </article>
              )}
            </li>
          ))}
        </ol>
      )}

      {/* Add-Form */}
      <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-navy-900/60 p-7 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-1/3 -top-1/3 -z-10 h-[360px] w-[360px] rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, rgba(94,234,212,0.12), transparent 72%)",
          }}
        />

        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-teal-300/80">
              Neuer Block
            </p>
            <h3 className="mt-2 font-display text-xl italic leading-tight text-white">
              Szene anlegen
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/55 transition hover:text-teal-300"
          >
            {showPreview ? "Vorschau aus" : "Vorschau ein"}
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className={fieldLabel}>Titel</label>
            <input
              placeholder="z. B. Gegenüberstellung: sicher vs. unsicher"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className={pillInput}
            />
          </div>

          <div
            className={
              showPreview
                ? "grid gap-5 md:grid-cols-2"
                : "grid grid-cols-1 gap-5"
            }
          >
            <div>
              <label className={fieldLabel}>Markdown</label>
              <textarea
                rows={showPreview ? 14 : 8}
                placeholder="# Überschrift&#10;&#10;Dein **Markdown** hier. Unterstützt GFM (Tabellen, Checklisten), Code-Blöcke mit Syntax-Highlight über Terminal-Style."
                value={draft.markdown}
                onChange={(e) =>
                  setDraft({ ...draft, markdown: e.target.value })
                }
                className={cardTextarea}
              />
            </div>
            {showPreview && (
              <div>
                <label className={fieldLabel}>Vorschau (live)</label>
                <div className="min-h-[calc(14rem+2px)] rounded-card border border-white/10 bg-navy-950/60 p-5">
                  <MarkdownPreview source={draft.markdown} />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[220px]">
              <label className={fieldLabel}>Trigger</label>
              <div className="relative">
                <select
                  value={draft.trigger}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      trigger: e.target.value as ServerBlock["trigger"],
                    })
                  }
                  className={pillSelect}
                >
                  <option value="manual">Manuell</option>
                  <option value="slide">An Folie binden</option>
                  <option value="always">Immer sichtbar</option>
                </select>
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-white/45"
                >
                  ▾
                </span>
              </div>
            </div>
            {draft.trigger === "slide" && (
              <div className="w-36">
                <label className={fieldLabel}>Folien-Nr.</label>
                <input
                  type="number"
                  min={1}
                  placeholder="3"
                  value={draft.slideNumber}
                  onChange={(e) =>
                    setDraft({ ...draft, slideNumber: e.target.value })
                  }
                  className={pillInput}
                />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={addBlock}
            disabled={pending || !draft.title.trim()}
            className={tealButton}
          >
            {pending ? "Anlegen …" : "Block anlegen →"}
          </button>
        </div>
      </div>
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
      className={`inline-flex h-9 w-9 items-center justify-center rounded-pill border border-transparent text-sm transition hover:border-white/15 hover:bg-white/5 ${
        danger
          ? "text-salmon-300 hover:border-salmon-400/30 hover:bg-salmon-500/10 hover:text-salmon-200"
          : "text-white/70 hover:text-white"
      }`}
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
  const [notes, setNotes] = useState(block.notes ?? "");
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
        notes: notes.trim() || undefined,
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
    <article className="relative overflow-hidden rounded-[20px] border border-teal-400/40 bg-navy-900/80 p-6 shadow-[0_20px_60px_-30px_rgba(94,234,212,0.35)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/60 to-transparent"
      />

      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-teal-300/90">
            Bearbeiten
          </p>
          <h4 className="mt-2 font-display text-lg italic leading-tight text-white">
            Block anpassen
          </h4>
        </div>
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/55 transition hover:text-teal-300"
        >
          {showPreview ? "Vorschau aus" : "Vorschau ein"}
        </button>
      </div>

      <div className="space-y-5">
        <div>
          <label className={fieldLabel}>Titel</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={pillInput}
          />
        </div>

        <div
          className={
            showPreview ? "grid gap-5 md:grid-cols-2" : "grid grid-cols-1 gap-5"
          }
        >
          <div>
            <label className={fieldLabel}>Markdown</label>
            <textarea
              rows={12}
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className={cardTextarea}
            />
          </div>
          {showPreview && (
            <div>
              <label className={fieldLabel}>Vorschau</label>
              <div className="min-h-[calc(12rem+2px)] rounded-card border border-white/10 bg-navy-950/60 p-5">
                <MarkdownPreview source={markdown} />
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
              Presenter-Notizen
            </label>
            <span className="text-[11px] text-white/40">
              nur für dich sichtbar
            </span>
          </div>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Stichpunkte, Timing, Anekdote — landen nicht im Handout."
            className={cardTextarea}
          />
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[220px]">
            <label className={fieldLabel}>Trigger</label>
            <div className="relative">
              <select
                value={trigger}
                onChange={(e) =>
                  setTrigger(e.target.value as typeof block.trigger)
                }
                className={pillSelect}
              >
                <option value="manual">Manuell</option>
                <option value="slide">An Folie</option>
                <option value="always">Immer sichtbar</option>
              </select>
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-white/45"
              >
                ▾
              </span>
            </div>
          </div>
          {trigger === "slide" && (
            <div className="w-36">
              <label className={fieldLabel}>Folien-Nr.</label>
              <input
                type="number"
                min={1}
                value={slideNumber}
                onChange={(e) => setSlideNumber(e.target.value)}
                className={pillInput}
              />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowAppearance((v) => !v)}
          aria-expanded={showAppearance}
          className="flex w-full items-center justify-between rounded-card border border-dashed border-white/15 bg-white/[0.02] px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-white/65 transition hover:border-teal-400/40 hover:text-teal-300"
        >
          Darstellung & Bild
          <span
            aria-hidden
            className="text-base transition-transform"
            style={{
              transform: showAppearance ? "rotate(90deg)" : "rotate(0)",
            }}
          >
            ›
          </span>
        </button>

        {showAppearance && (
          <div className="grid gap-5 md:grid-cols-2">
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
              <label className={fieldLabel}>Bild-URL (https)</label>
              <input
                type="url"
                placeholder="https://…"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className={pillInput}
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
              <label className={fieldLabel}>Bildunterschrift</label>
              <input
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                placeholder="Optional"
                className={pillInput}
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
                  <label className={fieldLabel}>
                    Terminal-Header (optional)
                  </label>
                  <input
                    value={terminalLabel}
                    onChange={(e) => setTerminalLabel(e.target.value)}
                    placeholder={
                      terminalVariant === "danger"
                        ? "z. B. UNSICHER · String-Verkettung"
                        : terminalVariant === "success"
                          ? "z. B. SICHER · Prepared Statement"
                          : "z. B. app.py"
                    }
                    className={pillInput}
                  />
                </div>
                <p className="text-[11px] leading-relaxed text-white/50 md:col-span-2">
                  Im Terminal-Layout wird der Markdown-Inhalt als reine Mono-
                  Zeile-für-Zeile getippt — ideal für Code-Snippets oder
                  Vergleiche (zwei Blöcke nebeneinander mit „SICHER" und
                  „UNSICHER").
                </p>
              </>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className={tealButton}
          >
            {saving ? "Speichern …" : "Speichern"}
          </button>
          <button type="button" onClick={onCancel} className={ghostButton}>
            Abbrechen
          </button>
        </div>
      </div>
    </article>
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
      <label className={fieldLabel}>{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={pillSelect}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-white/45"
        >
          ▾
        </span>
      </div>
    </div>
  );
}
