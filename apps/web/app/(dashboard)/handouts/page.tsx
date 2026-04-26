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

/**
 * DashboardPage — editorialer Hero + Stats + Toolbar + Grid/Liste.
 * Dark-Theme aus dem `(dashboard)`-Layout, gleiche typografische Sprache
 * wie die Landing: Eyebrow, großer Display-Headline mit Italic-Accent,
 * ruhige Trennung per Hairline-Borders.
 */
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

  const liveCount =
    sessions?.filter((s) => s.status === "live").length ??
    stats?.liveSessions ??
    0;

  return (
    <div className="space-y-14">
      {/* Editorial Hero */}
      <header className="grid gap-10 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <span className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-navy-400">
            <span aria-hidden className="inline-block h-px w-6 bg-white/20" />
            Dashboard
          </span>
          <h1 className="mt-5 font-display text-5xl leading-[0.95] tracking-tight text-white sm:text-6xl">
            Deine Handouts.{" "}
            <em className="font-display italic text-teal-300">Eine Bühne.</em>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-navy-100">
            Alles, was du brauchst, um Präsentationen live zu begleiten —
            Handouts, Sessions und Status auf einen Blick.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:col-span-5 md:justify-end">
          <Link
            href="/handouts/new"
            className="inline-flex items-center gap-2 rounded-pill bg-teal-400 px-5 py-3 text-sm font-semibold text-navy-1000 shadow-[0_10px_30px_-10px_rgba(94,234,212,0.6)] transition hover:bg-teal-300"
          >
            <span aria-hidden className="-ml-0.5 text-base leading-none">
              +
            </span>
            Neues Handout
          </Link>
        </div>
      </header>

      <StatGrid stats={stats} liveNow={liveCount} />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-6">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            {
              value: "handouts",
              label: "Handouts",
              count: handouts?.length,
            },
            {
              value: "sessions",
              label: "Sessions",
              count: sessions?.length,
            },
          ]}
        />
        {tab === "handouts" ? (
          <label className="relative inline-flex items-center">
            <span className="sr-only">Handouts durchsuchen</span>
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-3 h-4 w-4 text-navy-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              placeholder="Handouts durchsuchen …"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-64 rounded-pill border border-white/10 bg-navy-900 px-10 py-2 text-sm text-white placeholder:text-navy-400 focus:border-teal-400 focus:outline-none"
            />
          </label>
        ) : null}
      </div>

      {/* Content */}
      {tab === "handouts" ? (
        filtered === null ? (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-56" />
            <Skeleton className="h-56" />
            <Skeleton className="h-56" />
          </ul>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={filter ? "Nichts passt." : "Dein erstes Handout wartet."}
            body={
              filter
                ? "Probier einen anderen Suchbegriff oder leere das Feld."
                : "Leg ein neues Handout an und verbinde es mit deiner Präsentation."
            }
            cta={
              filter ? null : (
                <Link
                  href="/handouts/new"
                  className="inline-flex items-center gap-2 rounded-pill bg-teal-400 px-5 py-2.5 text-sm font-semibold text-navy-1000 hover:bg-teal-300"
                >
                  <span aria-hidden>+</span>
                  Neues Handout
                </Link>
              )
            }
          />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((h) => (
              <li key={h._id}>
                <HandoutCard handout={h} onChanged={load} />
              </li>
            ))}
          </ul>
        )
      ) : sessions === null ? (
        <ul className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </ul>
      ) : sessions.length === 0 ? (
        <EmptyState
          title="Noch keine Sessions."
          body="Sessions entstehen, sobald du ein Handout live schaltest."
        />
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

function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="relative overflow-hidden rounded-card border border-dashed border-white/10 bg-navy-900/40 px-8 py-14 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32"
        style={{
          background:
            "radial-gradient(ellipse 50% 100% at 50% 0%, rgba(94,234,212,0.08), transparent 70%)",
        }}
      />
      <p className="relative font-display text-2xl italic text-white">
        {title}
      </p>
      <p className="relative mx-auto mt-3 max-w-md text-sm text-navy-100">
        {body}
      </p>
      {cta ? <div className="relative mt-6">{cta}</div> : null}
    </div>
  );
}
