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

export function SessionRowItem({
  s,
}: {
  s: SessionRow;
}): React.ReactElement {
  const live = s.status === "live";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-white/5 bg-navy-900 px-5 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-pill px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${live ? "bg-emerald-400/20 text-emerald-400" : "bg-white/5 text-navy-400"}`}
          >
            {live ? "Live" : "Beendet"}
          </span>
          <p className="truncate text-sm font-semibold text-white">
            {s.handoutTitle ?? "—"}
          </p>
        </div>
        <p className="mt-1 text-xs text-navy-400">
          gestartet {fmt(s.startedAt)}
          {s.endedAt ? ` · beendet ${fmt(s.endedAt)}` : ""}
          {" · "}
          {s.audienceCount} Hörer
        </p>
      </div>
      <Link
        href={`/handouts/${s.handoutId}/present`}
        className="rounded-pill border border-white/15 px-4 py-2 text-xs font-medium text-white hover:border-white/40 hover:bg-white/5"
      >
        Öffnen →
      </Link>
    </div>
  );
}
