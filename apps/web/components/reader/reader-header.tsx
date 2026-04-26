"use client";

import { useEffect, useState } from "react";
import { useTheme } from "#/components/providers/theme-provider";
import {
  CheckIcon,
  CopyIcon,
  MoonIcon,
  PrintIcon,
  SunIcon,
} from "#/components/ui/icon";

/**
 * Reader-Toolbar — Copy-Link, Drucken, Theme-Toggle. Editorial treatment:
 * schmale pill-Buttons mit hairline-Borders, teal-Hover, copy-confirmation
 * als micro-transition. `no-print` damit die Toolbar im PDF verschwindet.
 */
export function ReaderHeader(): React.ReactElement {
  const { theme, toggle } = useTheme();
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard perms denied — silent ignore */
    }
  }

  return (
    <div className="no-print flex items-center gap-1.5 text-navy-700 dark:text-navy-100">
      <button
        type="button"
        onClick={copy}
        title="Link kopieren"
        aria-label="Link kopieren"
        className="group inline-flex h-9 items-center gap-1.5 rounded-pill border border-navy-200/80 bg-white/60 px-3 text-[11px] font-medium uppercase tracking-[0.12em] transition-colors hover:border-teal-500/60 hover:text-teal-600 dark:border-navy-700 dark:bg-navy-900/60 dark:hover:border-teal-400/50 dark:hover:text-teal-300"
      >
        <span
          aria-hidden
          className={`transition-transform ${copied ? "scale-110" : "scale-100"}`}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </span>
        <span className="hidden sm:inline">
          {copied ? "Kopiert" : "Link"}
        </span>
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        title="Drucken / als PDF speichern"
        aria-label="Drucken"
        className="inline-flex h-9 w-9 items-center justify-center rounded-pill border border-navy-200/80 bg-white/60 transition-colors hover:border-teal-500/60 hover:text-teal-600 dark:border-navy-700 dark:bg-navy-900/60 dark:hover:border-teal-400/50 dark:hover:text-teal-300"
      >
        <PrintIcon />
      </button>
      <button
        type="button"
        onClick={toggle}
        title={theme === "dark" ? "Heller Modus" : "Dunkler Modus"}
        aria-label="Farbschema umschalten"
        className="inline-flex h-9 w-9 items-center justify-center rounded-pill border border-navy-200/80 bg-white/60 transition-colors hover:border-teal-500/60 hover:text-teal-600 dark:border-navy-700 dark:bg-navy-900/60 dark:hover:border-teal-400/50 dark:hover:text-teal-300"
      >
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </button>
    </div>
  );
}
