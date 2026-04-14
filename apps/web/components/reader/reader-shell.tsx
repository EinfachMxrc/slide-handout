"use client";

import { useEffect } from "react";
import { useTheme } from "#/components/providers/theme-provider";

/**
 * Applies handout-level customization to the reader:
 *   - forces theme class on <html> if readerTheme is "light" or "dark"
 *   - exposes the accent color as a CSS var (--handout-accent) for use
 *     in child components (links, buttons, pulse ring).
 */
export function ReaderShell({
  accentColor,
  readerTheme,
  children,
}: {
  accentColor: string | null;
  readerTheme: "auto" | "light" | "dark";
  children: React.ReactNode;
}): React.ReactElement {
  const { theme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    if (readerTheme === "dark") {
      root.classList.add("dark");
    } else if (readerTheme === "light") {
      root.classList.remove("dark");
    } else {
      // auto — defer to the ThemeProvider (user choice / system pref).
      root.classList.toggle("dark", theme === "dark");
    }
  }, [readerTheme, theme]);

  const styleVars = accentColor
    ? ({
        ["--handout-accent" as string]: accentColor,
      } as React.CSSProperties)
    : undefined;

  return (
    <div
      data-reader-root
      style={styleVars}
      className={accentColor ? "reader-accent" : undefined}
    >
      {children}
    </div>
  );
}
