"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Id } from "@convex/_generated/dataModel";
import { Card } from "#/components/ui/card";
import { Input, Textarea } from "#/components/ui/input";
import { Button } from "#/components/ui/button";

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
 * Einklappbares Panel „Design & Einstellungen" im Editor — speichert alle
 * Reader-Customization in einem Rutsch per PATCH.
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
    try {
      const res = await fetch(`/api/handouts/${handoutId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(v),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error === "validation" ? "Ungültige Werte." : "Speichern fehlgeschlagen.");
        return;
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <h3 className="text-sm font-semibold">Design &amp; Einstellungen</h3>
          <p className="mt-0.5 text-xs text-navy-400">
            Akzentfarbe, Cover, Logo, Schrift, Theme, Footer
          </p>
        </div>
        <span
          className="text-lg text-navy-400 transition-transform"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0)" }}
          aria-hidden="true"
        >
          ›
        </span>
      </button>

      {open && (
        <div className="mt-5 grid gap-5 md:grid-cols-2">
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
          <div />
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
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-navy-400">
              Footer (Markdown)
            </label>
            <Textarea
              rows={4}
              placeholder="© 2026 · Fragen? kontakt@example.com"
              value={v.footerMarkdown}
              onChange={(e) => setV({ ...v, footerMarkdown: e.target.value })}
            />
          </div>
          {error && (
            <p className="text-sm text-red-500 md:col-span-2">{error}</p>
          )}
          <div className="md:col-span-2">
            <Button onClick={save} disabled={saving}>
              {saving ? "Speichern …" : "Einstellungen speichern"}
            </Button>
          </div>
        </div>
      )}
    </Card>
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
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-navy-400">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#5fbfbf"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded border border-navy-100 bg-transparent dark:border-navy-700"
        />
        <Input
          value={value}
          placeholder="#5fbfbf (leer = Standard)"
          onChange={(e) => onChange(e.target.value)}
          maxLength={7}
        />
      </div>
      {help && <p className="mt-1 text-xs text-navy-400">{help}</p>}
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
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-navy-400">
        {label}
      </label>
      <Input
        type="url"
        placeholder="https://…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {help && <p className="mt-1 text-xs text-navy-400">{help}</p>}
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
