"use client";

/**
 * Segmented — Tab-/Pill-Control. Optional mit Count-Badges hinter dem Label.
 * Wird im Dashboard für Handouts/Sessions und im Session-Shell für den
 * Sync-Modus genutzt.
 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; disabled?: boolean; count?: number }[];
  size?: "sm" | "md";
}): React.ReactElement {
  const padX = size === "sm" ? "px-3 py-1.5" : "px-4 py-2";
  const text = size === "sm" ? "text-xs" : "text-sm";
  return (
    <div
      role="tablist"
      className="inline-flex items-center rounded-pill border border-white/10 bg-navy-900 p-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]"
    >
      {options.map((o) => {
        const active = value === o.value;
        const hasCount = typeof o.count === "number";
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            type="button"
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={`relative inline-flex items-center gap-2 rounded-pill ${padX} ${text} font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
              active
                ? "bg-navy-1000 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                : "text-navy-100 hover:text-white"
            }`}
          >
            {o.label}
            {hasCount ? (
              <span
                className={`inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold ${
                  active
                    ? "bg-teal-400/15 text-teal-300"
                    : "bg-white/5 text-navy-400"
                }`}
              >
                {o.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
