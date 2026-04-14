"use client";

/**
 * Kleiner Status-Indikator: pulsiert, wenn die Live-Verbindung aktiv ist.
 * Vom Reader optional mountbar.
 */
export function PulseIndicator({
  active,
  label = "Live",
}: {
  active: boolean;
  label?: string;
}): React.ReactElement {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-navy-400">
      <span className="relative flex h-2 w-2">
        {active && (
          <span className="absolute inset-0 animate-ping rounded-full bg-teal-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${active ? "bg-teal-400" : "bg-navy-400"}`}
        />
      </span>
      {label}
    </span>
  );
}
