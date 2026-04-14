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
 * Reader toolbar — Print, Theme-Toggle, Copy-Link. Shown in the header
 * right column. `no-print` so the toolbar disappears on paper.
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
      /* clipboard perms denied — ignore */
    }
  }

  return (
    <div className="no-print flex items-center gap-2 text-navy-700 dark:text-navy-100">
      <button
        type="button"
        onClick={copy}
        title="Link kopieren"
        aria-label="Link kopieren"
        className="inline-flex h-8 items-center gap-1.5 rounded-pill border border-navy-100 px-3 text-xs hover:border-teal-400 hover:text-teal-500 dark:border-navy-700"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
        <span className="hidden sm:inline">
          {copied ? "Kopiert" : "Link"}
        </span>
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        title="Drucken / als PDF speichern"
        aria-label="Drucken"
        className="inline-flex h-8 w-8 items-center justify-center rounded-pill border border-navy-100 hover:border-teal-400 hover:text-teal-500 dark:border-navy-700"
      >
        <PrintIcon />
      </button>
      <button
        type="button"
        onClick={toggle}
        title={theme === "dark" ? "Heller Modus" : "Dunkler Modus"}
        aria-label="Farbschema umschalten"
        className="inline-flex h-8 w-8 items-center justify-center rounded-pill border border-navy-100 hover:border-teal-400 hover:text-teal-500 dark:border-navy-700"
      >
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </button>
    </div>
  );
}
