"use client";

import { useTheme } from "#/components/providers/theme-provider";
import { MoonIcon, SunIcon } from "#/components/ui/icon";

export function ThemeToggle(): React.ReactElement {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Zu hell wechseln" : "Zu dunkel wechseln"}
      title={theme === "dark" ? "Heller Modus" : "Dunkler Modus"}
      className="inline-flex h-8 w-8 items-center justify-center rounded-pill border border-navy-100 text-base text-navy-700 hover:border-teal-400 hover:text-teal-500 dark:border-navy-700 dark:text-navy-100"
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
