import Link from "next/link";

export interface SessionRow {
  _id: string;
  handoutId: string;
  handoutTitle?: string;
  status: "live" | "ended";
  startedAt: number;
  endedAt?: number;
  audienceCount: number;
}

function fmt(n: number): string {
  return new Date(n).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function duration(start: number, end?: number): string {
  const ms = (end ?? Date.now()) - start;
  const m = Math.max(0, Math.floor(ms / 60000));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return `${h} h ${r} m`;
}

/**
 * SessionRowItem — große, klickbare Zeile. Live-Sessions bekommen ein eigenes
 * Treatment: Emerald-Border, sanfter Glow, pulsender Dot. Beendete Sessions
 * sehen ruhig aus und verschwinden visuell in den Hintergrund.
 */
export function SessionRowItem({
  s,
}: {
  s: SessionRow;
}): React.ReactElement {
  const live = s.status === "live";
  return (
    <article
      className={`group relative flex flex-wrap items-center justify-between gap-3 overflow-hidden rounded-card border px-6 py-5 transition duration-200 hover:-translate-y-0.5 ${
        live
          ? "border-emerald-400/30 bg-emerald-400/[0.04] shadow-[0_0_0_1px_rgba(94,234,212,0.08)]"
          : "border-white/5 bg-navy-900 hover:border-white/15"
      }`}
    >
      {live ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(ellipse 40% 100% at 0% 50%, rgba(94,234,212,0.09), transparent 60%)",
          }}
        />
      ) : null}

      <div className="relative min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${
              live
                ? "bg-emerald-400/15 text-emerald-300"
                : "bg-white/5 text-navy-400"
            }`}
          >
            {live ? (
              <span className="relative inline-flex h-1.5 w-1.5">
                <span
                  aria-hidden
                  className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-70"
                />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
            ) : null}
            {live ? "Live" : "Beendet"}
          </span>
          <p className="truncate text-base font-semibold tracking-tight text-white">
            {s.handoutTitle ?? "—"}
          </p>
        </div>
        <p className="mt-1.5 text-xs text-navy-400">
          <span className="font-mono text-navy-100">{fmt(s.startedAt)}</span>
          <span aria-hidden className="mx-1.5 text-white/15">
            ·
          </span>
          {duration(s.startedAt, s.endedAt)}
          <span aria-hidden className="mx-1.5 text-white/15">
            ·
          </span>
          <span className="text-navy-100">
            {s.audienceCount}{" "}
            <span className="text-navy-400">
              {s.audienceCount === 1 ? "Hörer" : "Hörer"}
            </span>
          </span>
        </p>
      </div>
      <Link
        href={`/handouts/${s.handoutId}/present`}
        className="relative inline-flex items-center gap-1 rounded-pill border border-white/10 bg-navy-950/40 px-4 py-2 text-xs font-medium text-white backdrop-blur-sm transition hover:border-white/25 hover:bg-white/5"
      >
        Öffnen <span aria-hidden>→</span>
      </Link>
    </article>
  );
}
