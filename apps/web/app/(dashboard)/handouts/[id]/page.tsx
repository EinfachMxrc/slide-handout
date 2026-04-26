import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { getUserId } from "#/lib/auth/session";
import { BlockEditor } from "#/components/editor/block-editor";
import { HandoutHeader } from "#/components/dashboard/handout-header";
import { HandoutSettings } from "#/components/editor/handout-settings";
import { env } from "#/env";

/**
 * Handout-Editor (RSC).
 *
 * Aufbau:
 *   1. Breadcrumb (Dashboard / Handout-Name)
 *   2. Hero-Karte mit HandoutHeader (editorialer Titel, Public-Link-Chip,
 *      Rename/Delete-Icon-Buttons).
 *   3. CTA-Ribbon: Präsentieren-Button + Block-Count als editorial badge.
 *   4. HandoutSettings (collapsible Design & Einstellungen).
 *   5. BlockEditor (Haupt-Surface für Content).
 *
 * Das alles läuft innerhalb des dashboard layout's ForceDark-Shell, daher
 * sind alle Farben auf Navy/weiß getuned.
 */
export default async function HandoutEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  const userId = await getUserId();
  const handoutId = id as Id<"handouts">;
  const handout = await fetchQuery(api.handouts.get, {
    userId,
    id: handoutId,
  });
  if (!handout) notFound();
  const blocks = await fetchQuery(api.blocks.list, { userId, handoutId });

  const publicUrl = `${env.NEXT_PUBLIC_SITE_URL}/h/${handout.publicToken}`;
  const blockCount = blocks.length;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-white/45">
        <Link
          href="/dashboard"
          className="transition-colors hover:text-teal-300"
        >
          Dashboard
        </Link>
        <span aria-hidden className="text-white/25">
          /
        </span>
        <span className="truncate text-white/70">{handout.title}</span>
      </div>

      {/* Hero-Panel */}
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-navy-900/80 via-navy-900/60 to-navy-950/90 p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:p-10">
        {/* Sky-echo */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-1/4 -top-1/2 -z-10 h-[500px] w-[500px] rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, rgba(94,234,212,0.18), transparent 70%)",
          }}
        />
        <HandoutHeader
          handoutId={handout._id}
          initialTitle={handout.title}
          initialDescription={handout.description}
          publicUrl={publicUrl}
        />

        {/* CTA-Ribbon */}
        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-white/10 pt-6">
          <Link
            href={`/handouts/${handout._id}/present`}
            className="inline-flex items-center gap-2 rounded-pill bg-teal-400 px-5 py-2.5 text-sm font-semibold text-navy-1000 shadow-[0_10px_30px_-10px_rgba(94,234,212,0.65)] transition hover:bg-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-400/30"
          >
            Präsentieren
            <span aria-hidden>→</span>
          </Link>
          <Link
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-pill border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white/85 transition hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
          >
            Reader öffnen
            <span aria-hidden>↗</span>
          </Link>
          <span className="ml-auto inline-flex items-center gap-2 rounded-pill border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full bg-teal-400"
            />
            {blockCount === 0
              ? "Noch keine Blöcke"
              : `${blockCount} Block${blockCount === 1 ? "" : "s"}`}
          </span>
        </div>
      </section>

      {/* Settings */}
      <HandoutSettings
        handoutId={handout._id}
        initial={{
          accentColor: handout.accentColor ?? null,
          coverImageUrl: handout.coverImageUrl ?? null,
          logoUrl: handout.logoUrl ?? null,
          fontFamily: handout.fontFamily ?? null,
          readerTheme: handout.readerTheme ?? null,
          footerMarkdown: handout.footerMarkdown ?? null,
        }}
      />

      {/* Block-Editor */}
      <BlockEditor handoutId={handout._id} initialBlocks={blocks} />
    </div>
  );
}
