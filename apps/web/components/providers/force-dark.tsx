"use client";

import { useEffect } from "react";

/**
 * Setzt vorübergehend die `dark`-Klasse auf <html> für Bereiche, die immer
 * dunkel laufen sollen (Dashboard/Editor/Session). Beim Verlassen wird die
 * vorherige User-Präferenz aus localStorage wiederhergestellt.
 */
export function ForceDark(): null {
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    root.classList.add("dark");
    return () => {
      const stored = localStorage.getItem("sh-theme");
      const userWantsLight = stored === "light";
      root.classList.toggle("dark", wasDark && !userWantsLight);
    };
  }, []);
  return null;
}
