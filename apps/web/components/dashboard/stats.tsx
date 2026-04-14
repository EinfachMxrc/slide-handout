export interface DashboardStats {
  handouts: number;
  liveSessions: number;
  drafts: number;
}

export function StatGrid({
  stats,
}: {
  stats: DashboardStats | null;
}): React.ReactElement {
  const items = [
    { label: "Handouts", value: stats?.handouts ?? 0 },
    { label: "Live-Sessions", value: stats?.liveSessions ?? 0 },
    { label: "Entwürfe", value: stats?.drafts ?? 0 },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-card border border-white/5 bg-navy-900 px-5 py-4"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
            {it.label}
          </p>
          <p className="mt-1.5 text-3xl font-semibold tracking-tight text-white">
            {it.value}
          </p>
        </div>
      ))}
    </div>
  );
}
