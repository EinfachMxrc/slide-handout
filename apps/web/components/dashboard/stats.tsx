export interface DashboardStats {
  handouts: number;
  liveSessions: number;
  drafts: number;
}

/**
 * StatGrid — drei Kacheln mit großen, editorialen Zahlen, uppercase-Eyebrows
 * und einem Live-Puls, wenn gerade eine Session läuft.
 *
 * Akzeptiert optional `liveNow`, damit der Aufrufer eine "frisch gezählte"
 * Live-Sessions-Zahl durchreichen kann (z. B. aus dem Sessions-Tab).
 */
export function StatGrid({
  stats,
  liveNow,
}: {
  stats: DashboardStats | null;
  liveNow?: number;
}): React.ReactElement {
  const loading = stats === null;
  const liveValue = liveNow ?? stats?.liveSessions ?? 0;
  const items = [
    {
      label: "Handouts",
      value: stats?.handouts ?? 0,
      meta: "Insgesamt erstellt",
      accent: false,
    },
    {
      label: "Live-Sessions",
      value: liveValue,
      meta: liveValue > 0 ? "Jetzt live" : "Bereit zum Start",
      accent: liveValue > 0,
    },
    {
      label: "Entwürfe",
      value: stats?.drafts ?? 0,
      meta: "Noch nicht geteilt",
      accent: false,
    },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map((it) => (
        <div
          key={it.label}
          className="group relative overflow-hidden rounded-card border border-white/5 bg-navy-900 p-6 transition hover:border-white/10"
        >
          {/* sanftes Shimmer auf Hover */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(ellipse 120% 80% at 50% 0%, rgba(94,234,212,0.06), transparent 70%)",
            }}
          />
          <div className="relative flex items-baseline justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-navy-400">
              {it.label}
            </p>
            {it.accent ? (
              <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                <span className="relative inline-flex h-1.5 w-1.5">
                  <span
                    aria-hidden
                    className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-70"
                  />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                Live
              </span>
            ) : null}
          </div>
          <p className="relative mt-3 font-display text-5xl leading-none tracking-tight text-white">
            {loading ? (
              <span
                aria-hidden
                className="inline-block h-10 w-16 animate-pulse rounded bg-white/5"
              />
            ) : (
              it.value
            )}
          </p>
          <p className="relative mt-4 text-xs leading-relaxed text-navy-400">
            {it.meta}
          </p>
        </div>
      ))}
    </div>
  );
}
