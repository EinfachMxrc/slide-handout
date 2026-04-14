"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Id } from "@convex/_generated/dataModel";
import { Skeleton } from "#/components/ui/skeleton";
import { HandoutCard } from "#/components/dashboard/handout-card";
import { Segmented } from "#/components/dashboard/segmented";
import { StatGrid, type DashboardStats } from "#/components/dashboard/stats";
import {
  SessionRowItem,
  type SessionRow,
} from "#/components/dashboard/session-row";

interface Handout {
  _id: Id<"handouts">;
  title: string;
  description: string;
  publicToken: string;
  createdAt?: number;
  updatedAt?: number;
}

export default function DashboardPage(): React.ReactElement {
  const [tab, setTab] = useState<"handouts" | "sessions">("handouts");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [handouts, setHandouts] = useState<Handout[] | null>(null);
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    const [s, h] = await Promise.all([
      fetch("/api/dashboard/stats").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/dashboard/handouts").then((r) => (r.ok ? r.json() : [])),
    ]);
    setStats(s);
    setHandouts(h);
  }, []);

  const loadSessions = useCallback(async () => {
    const r = await fetch("/api/dashboard/sessions");
    if (r.ok) setSessions(await r.json());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (tab === "sessions" && sessions === null) void loadSessions();
  }, [tab, sessions, loadSessions]);

  const filtered =
    handouts?.filter((h) =>
      filter
        ? (h.title + " " + h.description)
            .toLowerCase()
            .includes(filter.toLowerCase())
        : true,
    ) ?? null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-navy-100">
            Ihre Handouts und Sessions auf einen Blick.
          </p>
        </div>
        <Link
          href="/handouts/new"
          className="rounded-pill bg-teal-400 px-5 py-2.5 text-sm font-semibold text-navy-1000 shadow-sm shadow-teal-400/30 hover:bg-teal-300"
        >
          Neues Handout
        </Link>
      </div>

      <StatGrid stats={stats} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "handouts", label: "Handouts" },
            { value: "sessions", label: "Sessions" },
          ]}
        />
        {tab === "handouts" && (
          <input
            type="search"
            placeholder="Suchen …"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-pill border border-white/10 bg-navy-900 px-4 py-1.5 text-sm text-white placeholder:text-navy-400 focus:border-teal-400"
          />
        )}
      </div>

      {tab === "handouts" ? (
        filtered === null ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-44" />
            <Skeleton className="h-44" />
            <Skeleton className="h-44" />
          </ul>
        ) : filtered.length === 0 ? (
          <p className="rounded-card border border-dashed border-white/10 px-8 py-12 text-center text-navy-400">
            {filter
              ? "Nichts passt zum Suchbegriff."
              : "Noch keine Handouts. Lege eines an."}
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((h) => (
              <li key={h._id}>
                <HandoutCard handout={h} onChanged={load} />
              </li>
            ))}
          </ul>
        )
      ) : sessions === null ? (
        <ul className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </ul>
      ) : sessions.length === 0 ? (
        <p className="rounded-card border border-dashed border-white/10 px-8 py-12 text-center text-navy-400">
          Noch keine Sessions gestartet.
        </p>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <SessionRowItem key={s._id} s={s} />
          ))}
        </div>
      )}
    </div>
  );
}
