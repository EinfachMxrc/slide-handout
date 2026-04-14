"use client";

/**
 * Reusable segmented-control / tab pill. Used in dashboard tabs and the
 * session sync-mode picker.
 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; disabled?: boolean }[];
  size?: "sm" | "md";
}): React.ReactElement {
  const padX = size === "sm" ? "px-3 py-1.5" : "px-4 py-2";
  const text = size === "sm" ? "text-xs" : "text-sm";
  return (
    <div className="inline-flex rounded-pill border border-white/10 bg-navy-900 p-1">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={`rounded-pill ${padX} ${text} font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
              active
                ? "bg-navy-1000 text-white shadow-sm"
                : "text-navy-100 hover:text-white"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
