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
      <figure className="my-0 overflow-hidden rounded-card">
        {/* Plain <img> — user-pasted hosts not in next/image remotePatterns. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img}
          alt={block.imageCaption ?? ""}
          loading="lazy"
          className="w-full object-cover"
        />
        {block.imageCaption && (
          <figcaption className="mt-1 px-1 text-xs text-navy-400">
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
                className="rounded bg-navy-100 px-1 py-0.5 font-mono text-xs dark:bg-navy-800"
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
        className={`relative overflow-hidden rounded-card p-6 text-white shadow-sm ${layoutArticle[block.layout]}`}
        style={{
          backgroundImage: `linear-gradient(rgba(10,20,38,0.55), rgba(10,20,38,0.55)), url("${img}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <h2 className="mb-3 text-xl font-semibold tracking-tight">
          {block.title}
        </h2>
        {Content}
      </article>
    );
  }

  // Full-width image, edge-to-edge above the heading.
  if (img && block.imagePosition === "full") {
    return (
      <article
        className={`overflow-hidden rounded-card border border-navy-100 bg-white shadow-sm dark:border-navy-700 dark:bg-navy-900 ${layoutArticle[block.layout]}`}
      >
        {Image}
        <div className="p-6">
          <h2 className="mb-3 text-xl font-semibold tracking-tight">
            {block.title}
          </h2>
          {Content}
        </div>
      </article>
    );
  }

  // Side layouts: image left or right, content fills the rest.
  if (img && (block.imagePosition === "left" || block.imagePosition === "right")) {
    return (
      <article
        className={`grid grid-cols-1 gap-6 rounded-card border border-navy-100 bg-white p-6 shadow-sm sm:grid-cols-[minmax(0,200px)_1fr] dark:border-navy-700 dark:bg-navy-900 ${layoutArticle[block.layout]} ${block.imagePosition === "right" ? "sm:[grid-template-columns:1fr_minmax(0,200px)]" : ""}`}
      >
        {block.imagePosition === "left" && Image}
        <div>
          <h2 className="mb-3 text-xl font-semibold tracking-tight">
            {block.title}
          </h2>
          {Content}
        </div>
        {block.imagePosition === "right" && Image}
      </article>
    );
  }

  // Default: top / bottom image (or no image).
  return (
    <article
      className={`rounded-card border border-navy-100 bg-white p-6 shadow-sm dark:border-navy-700 dark:bg-navy-900 ${layoutArticle[block.layout]} ${layoutWrapper[block.layout]}`}
    >
      <h2 className="mb-3 text-xl font-semibold tracking-tight">
        {block.title}
      </h2>
      {img && block.imagePosition === "top" && <div className="mb-4">{Image}</div>}
      {Content}
      {img && block.imagePosition === "bottom" && <div className="mt-4">{Image}</div>}
    </article>
  );
}
