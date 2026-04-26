"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Id } from "@convex/_generated/dataModel";

type FontFamily = "sans" | "serif" | "mono";
type ReaderTheme = "auto" | "light" | "dark";

export interface HandoutSettingsValue {
  accentColor: string | null;
  coverImageUrl: string | null;
  logoUrl: string | null;
  fontFamily: FontFamily | null;
  readerTheme: ReaderTheme | null;
  footerMarkdown: string | null;
}

/**
 * Einklappbares Panel „Design & Einstellungen" — speichert alle Reader-
 * Customization in einem Rutsch per PATCH.
 *
 * Editorial treatment: Header mit eyebrow + italic display Titel, expand-
 * Chevron rechts, Content-Grid mit 2 Spalten. Alle Inputs sind dark-glass
 * mit teal Focus-State.
 */
export function HandoutSettings({
  handoutId,
  initial,
}: {
  handoutId: Id<"handouts">;
  initial: HandoutSettingsValue;
}): React.ReactElement {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [v, setV] = useState({
    accentColor: initial.accentColor ?? "",
    coverImageUrl: initial.coverImageUrl ?? "",
    logoUrl: initial.logoUrl ?? "",
    fontFamily: (initial.fontFamily ?? "sans") as FontFamily,
    readerTheme: (initial.readerTheme ?? "auto") as ReaderTheme,
    footerMarkdown: initial.footerMarkdown ?? "",
  });

  async function save(): Promise<void> {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/handouts/${handoutId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(v),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(
          body?.error === "validation"
            ? "Ungültige Werte."
            : "Speichern fehlgeschlagen.",
        );
        return;
      }
      setSaved(true);
      router.refresh();
      window.setTimeout(() => setSaved(false), 1800);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-[24px] border border-white/10 bg-navy-900/60 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.5)] backdrop-blur-xl">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="group flex w-full items-center justify-between gap-6 px-7 py-6 text-left transition hover:bg-white/[0.02]"
      >
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-teal-300/80">
            Design & Reader
          </p>
          <h3 className="mt-2 font-display text-xl italic leading-tight text-white">
            Branding, Theme, Footer
          </h3>
          <p className="mt-1 text-xs text-white/50">
            Akzentfarbe, Cover-Bild, Logo, Schrift, Reader-Theme, Footer-
            Markdown — alles auf einen Blick.
          </p>
        </div>
        <span
          aria-hidden
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-pill border border-white/10 bg-white/[0.04] text-white/70 transition group-hover:border-teal-300/40 group-hover:text-teal-300"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0)" }}
        >
          ›
        </span>
      </button>

      {open && (
        <div className="grid gap-6 border-t border-white/10 px-7 py-7 md:grid-cols-2">
          <FieldColor
            label="Akzentfarbe"
            help="Überschriften & Links im Reader."
            value={v.accentColor}
            onChange={(x) => setV({ ...v, accentColor: x })}
          />
          <FieldSelect
            label="Reader-Theme"
            value={v.readerTheme}
            onChange={(x) => setV({ ...v, readerTheme: x as ReaderTheme })}
            options={[
              { value: "auto", label: "Auto (Geräteeinstellung)" },
              { value: "light", label: "Immer hell" },
              { value: "dark", label: "Immer dunkel" },
            ]}
          />
          <FieldSelect
            label="Schriftart"
            value={v.fontFamily}
            onChange={(x) => setV({ ...v, fontFamily: x as FontFamily })}
            options={[
              { value: "sans", label: "Sans-Serif (Inter)" },
              { value: "serif", label: "Serif" },
              { value: "mono", label: "Monospace" },
            ]}
          />
          <div className="hidden md:block" />
          <FieldUrl
            label="Cover-Bild"
            help="3:1 funktioniert am besten. https:// URL."
            value={v.coverImageUrl}
            onChange={(x) => setV({ ...v, coverImageUrl: x })}
          />
          <FieldUrl
            label="Logo"
            help="Quadratisch, erscheint neben dem Titel."
            value={v.logoUrl}
            onChange={(x) => setV({ ...v, logoUrl: x })}
          />
          <div className="md:col-span-2">
            <FieldLabel>Footer (Markdown)</FieldLabel>
            <textarea
              rows={4}
              placeholder="© 2026 · Fragen? kontakt@example.com"
              value={v.footerMarkdown}
              onChange={(e) => setV({ ...v, footerMarkdown: e.target.value })}
              className={settingsTextareaClass}
            />
          </div>
          {error && (
            <div
              role="alert"
              className="rounded-card border border-salmon-400/30 bg-salmon-500/10 px-4 py-3 text-sm text-salmon-200 md:col-span-2"
            >
              {error}
            </div>
          )}
          <div className="flex items-center gap-3 md:col-span-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-pill bg-teal-400 px-5 py-2.5 text-sm font-semibold text-navy-1000 shadow-[0_10px_30px_-10px_rgba(94,234,212,0.65)] transition hover:bg-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-400/30 disabled:cursor-not-allowed disabled:bg-teal-400/50"
            >
              {saving ? "Speichern …" : "Einstellungen speichern"}
            </button>
            {saved && (
              <span
                role="status"
                className="inline-flex items-center gap-2 text-xs font-medium text-teal-300"
              >
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 rounded-full bg-teal-400"
                />
                Gespeichert
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/* ——— shared pieces ——— */

const settingsInputClass =
  "w-full rounded-pill border border-white/10 bg-navy-950/70 px-4 py-2.5 text-sm text-white placeholder:text-white/30 transition-[border-color,box-shadow] focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-400/20";

const settingsSelectClass =
  "w-full appearance-none rounded-pill border border-white/10 bg-navy-950/70 px-4 py-2.5 text-sm text-white transition-[border-color,box-shadow] focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-400/20";

const settingsTextareaClass =
  "w-full rounded-card border border-white/10 bg-navy-950/70 px-4 py-3 font-mono text-sm leading-relaxed text-white placeholder:text-white/30 transition-[border-color,box-shadow] focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-400/20";

function FieldLabel({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="mb-2 flex items-baseline justify-between">
      <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
        {children}
      </label>
    </div>
  );
}

function FieldColor({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  value: string;
  onChange: (v: string) => void;
}): React.ReactElement {
  const swatchColor = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#5fbfbf";
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-3">
        <label className="relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-pill border border-white/15 ring-2 ring-white/5 transition hover:border-white/30">
          <input
            type="color"
            value={swatchColor}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label={`${label} wählen`}
          />
          <span
            aria-hidden
            className="block h-full w-full"
            style={{ backgroundColor: swatchColor }}
          />
        </label>
        <input
          type="text"
          value={value}
          placeholder="#5fbfbf (leer = Standard)"
          onChange={(e) => onChange(e.target.value)}
          maxLength={7}
          className={settingsInputClass}
        />
      </div>
      {help && <p className="mt-2 text-[11px] text-white/45">{help}</p>}
    </div>
  );
}

function FieldUrl({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  value: string;
  onChange: (v: string) => void;
}): React.ReactElement {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        type="url"
        placeholder="https://…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={settingsInputClass}
      />
      {help && <p className="mt-2 text-[11px] text-white/45">{help}</p>}
    </div>
  );
}

function FieldSelect({
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
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={settingsSelectClass}
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
