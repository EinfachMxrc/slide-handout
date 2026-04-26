import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { sanitizeSchema } from "#/lib/sanitize";
import { env } from "#/env";
import { TerminalCode } from "./terminal-code";
import { TerminalBlock, type TerminalVariant } from "./terminal-block";
import type { Id } from "@convex/_generated/dataModel";

export interface RenderableBlock {
  _id: Id<"blocks">;
  title: string;
  markdown: string;
  imageS3Key?: string;
  imageUrl?: string;
  imageCaption?: string;
  layout: "default" | "centered" | "wide" | "compact" | "terminal";
  imagePosition: "top" | "bottom" | "left" | "right" | "full" | "background";
  fontSize: "sm" | "base" | "lg" | "xl";
  terminalVariant?: TerminalVariant;
  terminalLabel?: string;
}

const layoutWrapper: Record<RenderableBlock["layout"], string> = {
  default: "",
  centered: "text-center mx-auto",
  wide: "", // handled by outer max-width bump
  compact: "mx-auto max-w-prose",
  terminal: "", // own renderer
};

const layoutArticle: Record<RenderableBlock["layout"], string> = {
  default: "",
  centered: "text-center",
  wide: "!max-w-none",
  compact: "text-sm",
  terminal: "",
};

const fontSizeClass: Record<RenderableBlock["fontSize"], string> = {
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-2xl",
};

/**
 * Shared editorial card surface for reader blocks: hairline border,
 * soft elevation, sky-white in light / navy-glass in dark. Padding
 * erhöht auf 7/8 für bessere Atmung.
 */
const cardBase =
  "rounded-[20px] border border-navy-200/70 bg-white/90 shadow-[0_2px_16px_-6px_rgba(15,23,42,0.08)] backdrop-blur-sm dark:border-navy-800/60 dark:bg-navy-900/70 dark:shadow-[0_20px_60px_-30px_rgba(0,0,0,0.5)]";

/**
 * Editorial heading — italic display font, subtle teal accent bar links
 * vor dem Titel als rhythmischer Anker. `onImage` tone für background-
 * layout (white text + teal-300 bar).
 */
function BlockHeading({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "onImage";
}): React.ReactElement {
  return (
    <h2
      className={`mb-4 flex items-center gap-3 font-display text-xl italic leading-snug tracking-tight ${
        tone === "onImage" ? "text-white" : "text-navy-900 dark:text-navy-50"
      }`}
    >
      <span
        aria-hidden
        className={`inline-block h-4 w-[3px] rounded-full ${
          tone === "onImage" ? "bg-teal-300" : "bg-teal-500 dark:bg-teal-400"
        }`}
      />
      <span>{children}</span>
    </h2>
  );
}

function resolveImage(block: RenderableBlock): string | null {
  if (block.imageUrl && /^https:\/\//.test(block.imageUrl)) return block.imageUrl;
  if (block.imageS3Key) {
    const base = env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL;
    if (!base) return null;
    return `${base}/${block.imageS3Key}`;
  }
  return null;
}

export function BlockRenderer({
  block,
}: {
  block: RenderableBlock;
}): React.ReactElement {
  // Terminal-Layout hat einen eigenen Frame inkl. Tipp-Animation und ignoriert
  // alle anderen Layout-/Bild-Optionen — der Markdown-Quellcode wird 1:1 in
  // den Terminal-Body übernommen und Zeile-für-Zeile getippt.
  if (block.layout === "terminal") {
    return (
      <TerminalBlock
        title={block.title}
        markdown={block.markdown}
        variant={block.terminalVariant ?? "neutral"}
        label={block.terminalLabel}
      />
    );
  }

  const img = resolveImage(block);

  const Image =
    img !== null ? (
      <figure className="my-0 overflow-hidden rounded-[14px]">
        {/* Plain <img> — user-pasted hosts not in next/image remotePatterns. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img}
          alt={block.imageCaption ?? ""}
          loading="lazy"
          className="w-full object-cover"
        />
        {block.imageCaption && (
          <figcaption className="mt-2 px-1 text-[11px] italic text-navy-500 dark:text-navy-300/70">
            {block.imageCaption}
          </figcaption>
        )}
      </figure>
    ) : null;

  const Content = (
    <div
      className={`prose prose-navy dark:prose-invert ${fontSizeClass[block.fontSize]} ${block.layout === "compact" ? "prose-sm" : ""}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
        components={{
          code({ className, children, ...props }) {
            const lang = /language-(\w+)/.exec(className ?? "")?.[1];
            const text = String(children).replace(/\n$/, "");
            if (lang) {
              return <TerminalCode language={lang} code={text} />;
            }
            return (
              <code
                className="rounded bg-navy-100 px-1.5 py-0.5 font-mono text-[0.85em] text-navy-800 dark:bg-navy-800/80 dark:text-navy-100"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre({ children }) {
            return <>{children}</>;
          },
        }}
      >
        {block.markdown}
      </ReactMarkdown>
    </div>
  );

  // Special "background" layout: image fills the card as background, text on top.
  if (img && block.imagePosition === "background") {
    return (
      <article
        className={`relative overflow-hidden rounded-[20px] p-8 text-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] ${layoutArticle[block.layout]}`}
        style={{
          backgroundImage: `linear-gradient(rgba(10,20,38,0.72), rgba(10,20,38,0.55)), url("${img}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <BlockHeading tone="onImage">{block.title}</BlockHeading>
        {Content}
      </article>
    );
  }

  // Full-width image, edge-to-edge above the heading.
  if (img && block.imagePosition === "full") {
    return (
      <article
        className={`overflow-hidden ${cardBase} ${layoutArticle[block.layout]}`}
      >
        {Image}
        <div className="p-7 sm:p-8">
          <BlockHeading>{block.title}</BlockHeading>
          {Content}
        </div>
      </article>
    );
  }

  // Side layouts: image left or right, content fills the rest.
  if (img && (block.imagePosition === "left" || block.imagePosition === "right")) {
    return (
      <article
        className={`grid grid-cols-1 gap-6 p-7 sm:grid-cols-[minmax(0,220px)_1fr] sm:p-8 ${cardBase} ${layoutArticle[block.layout]} ${block.imagePosition === "right" ? "sm:[grid-template-columns:1fr_minmax(0,220px)]" : ""}`}
      >
        {block.imagePosition === "left" && Image}
        <div>
          <BlockHeading>{block.title}</BlockHeading>
          {Content}
        </div>
        {block.imagePosition === "right" && Image}
      </article>
    );
  }

  // Default: top / bottom image (or no image).
  return (
    <article
      className={`p-7 sm:p-8 ${cardBase} ${layoutArticle[block.layout]} ${layoutWrapper[block.layout]}`}
    >
      <BlockHeading>{block.title}</BlockHeading>
      {img && block.imagePosition === "top" && <div className="mb-5">{Image}</div>}
      {Content}
      {img && block.imagePosition === "bottom" && <div className="mt-5">{Image}</div>}
    </article>
  );
}
