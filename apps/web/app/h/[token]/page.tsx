import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { sanitizeSchema } from "#/lib/sanitize";
import { ReaderClient } from "./reader-client";
import { BlockRenderer } from "#/components/reader/block-renderer";
import { ReaderHeader } from "#/components/reader/reader-header";
import { ReaderHeartbeat } from "#/components/reader/heartbeat";
import { ReaderShell } from "#/components/reader/reader-shell";

/**
 * Audience-Reader (RSC).
 *
 * Editorial treatment: eyebrow über dem Titel, italic display-headline,
 * dezentes hairline-divider zum Content. Cover-Bild bekommt oben einen
 * subtilen gradient-fade, damit der Titel-Header nicht hart abbricht.
 *
 * Wrapping via <ReaderShell/> applies handout-level customizations
 * (accentColor, fontFamily, readerTheme) before any block renders.
 */
export default async function ReaderPage({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<React.ReactElement> {
  const { token } = await params;
  const handout = await fetchQuery(api.handouts.getPublic, {
    publicToken: token,
  });
  if (!handout) notFound();

  const alwaysBlocks = await fetchQuery(api.blocks.alwaysVisibleByHandout, {
    handoutId: handout._id,
  });

  const fontClass =
    handout.fontFamily === "serif"
      ? "font-serif"
      : handout.fontFamily === "mono"
        ? "font-mono"
        : "font-sans";

  return (
    <ReaderShell
      accentColor={handout.accentColor ?? null}
      readerTheme={handout.readerTheme ?? "auto"}
    >
      <main
        className={`min-h-screen bg-navy-50 text-navy-900 dark:bg-navy-950 dark:text-navy-50 ${fontClass}`}
      >
        {handout.coverImageUrl && (
          <div className="relative aspect-[3/1] max-h-72 w-full overflow-hidden bg-navy-100 dark:bg-navy-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={handout.coverImageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
            {/* Subtle fade to bg for visual handoff */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-navy-50 to-transparent dark:from-navy-950"
            />
          </div>
        )}

        <header className="border-b border-navy-200/60 dark:border-navy-800/80">
          <div className="mx-auto flex max-w-3xl items-start justify-between gap-6 px-6 py-10 sm:py-12">
            <div className="flex min-w-0 flex-1 items-start gap-5">
              {handout.logoUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={handout.logoUrl}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-card object-cover ring-1 ring-navy-200/60 dark:ring-navy-700/60"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-teal-600 dark:text-teal-300/80">
                  Handout
                </p>
                <h1 className="mt-2 font-display text-[clamp(1.75rem,1.2rem+2.2vw,2.75rem)] italic leading-[1.05] tracking-[-0.01em]">
                  {handout.title}
                </h1>
                {handout.description && (
                  <p className="mt-3 max-w-prose text-sm leading-relaxed text-navy-700 dark:text-navy-100/80">
                    {handout.description}
                  </p>
                )}
                {!handout.presenterSessionId && (
                  <p className="no-print mt-5 inline-flex items-center gap-2 rounded-pill border border-navy-200/80 bg-white/70 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-navy-700 dark:border-navy-700/80 dark:bg-navy-900/60 dark:text-navy-100/80">
                    <span
                      aria-hidden
                      className="inline-block h-1.5 w-1.5 rounded-full bg-navy-400 dark:bg-navy-500"
                    />
                    Noch keine Sitzung aktiv
                  </p>
                )}
              </div>
            </div>
            <ReaderHeader />
          </div>
        </header>

        <section className="mx-auto max-w-3xl space-y-5 px-6 py-10 sm:py-12">
          {alwaysBlocks.map((b) => (
            <BlockRenderer key={b._id} block={b} />
          ))}
          {handout.presenterSessionId && (
            <>
              <ReaderHeartbeat
                presenterSessionId={handout.presenterSessionId}
              />
              <ReaderClient
                presenterSessionId={handout.presenterSessionId}
                preRenderedIds={alwaysBlocks.map((b) => b._id)}
              />
            </>
          )}
        </section>

        {handout.footerMarkdown && (
          <footer className="no-print border-t border-navy-200/60 py-10 dark:border-navy-800/80">
            <div className="prose prose-navy mx-auto max-w-3xl px-6 text-sm text-navy-600 dark:prose-invert dark:text-navy-200/70">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
              >
                {handout.footerMarkdown}
              </ReactMarkdown>
            </div>
          </footer>
        )}
      </main>
    </ReaderShell>
  );
}
