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
          <div className="relative aspect-[3/1] max-h-64 w-full overflow-hidden bg-navy-100 dark:bg-navy-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={handout.coverImageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <header className="border-b border-navy-100 dark:border-navy-800">
          <div className="mx-auto flex max-w-3xl items-start justify-between gap-4 px-6 py-6">
            <div className="flex flex-1 items-start gap-4">
              {handout.logoUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={handout.logoUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-card object-cover"
                />
              )}
              <div className="flex-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {handout.title}
                </h1>
                {handout.description && (
                  <p className="mt-2 text-sm text-navy-700 dark:text-navy-100">
                    {handout.description}
                  </p>
                )}
                {!handout.presenterSessionId && (
                  <p className="no-print mt-3 inline-flex rounded-pill bg-navy-100 px-3 py-1 text-xs text-navy-700 dark:bg-navy-800 dark:text-navy-100">
                    Noch keine Sitzung aktiv — wartet auf den Vortragenden.
                  </p>
                )}
              </div>
            </div>
            <ReaderHeader />
          </div>
        </header>

        <section className="mx-auto max-w-3xl space-y-4 px-6 py-8">
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
          <footer className="no-print border-t border-navy-100 py-8 dark:border-navy-800">
            <div className="prose prose-navy mx-auto max-w-3xl px-6 text-sm dark:prose-invert">
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
