"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { sanitizeSchema } from "#/lib/sanitize";

/**
 * Live preview für den Editor — rendert Markdown identisch zum Reader,
 * mit demselben Sanitize-Schema gegen XSS.
 */
export function MarkdownPreview({
  source,
}: {
  source: string;
}): React.ReactElement {
  if (!source.trim()) {
    return (
      <p className="italic text-navy-400">
        Vorschau erscheint hier, sobald du Inhalt einträgst.
      </p>
    );
  }
  return (
    <div className="prose prose-navy max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
