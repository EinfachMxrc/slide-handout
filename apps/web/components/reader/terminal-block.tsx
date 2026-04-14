"use client";

import { useEffect, useRef, useState } from "react";

export type TerminalVariant = "neutral" | "success" | "danger";

interface Props {
  title: string;
  markdown: string;
  variant?: TerminalVariant;
  /** Optional override für die Header-Zeile, sonst wird `title` benutzt. */
  label?: string;
}

const VARIANT_STYLE: Record<
  TerminalVariant,
  { headerColor: string; icon: string; ringColor: string }
> = {
  neutral: {
    headerColor: "text-teal-300",
    icon: "$",
    ringColor: "border-white/10",
  },
  success: {
    headerColor: "text-teal-300",
    icon: "✓",
    ringColor: "border-teal-400/40",
  },
  danger: {
    headerColor: "text-salmon-300",
    icon: "✗",
    ringColor: "border-salmon-400/40",
  },
};

/**
 * Terminal-Block — komplette Markdown-Quelle wird Zeile-für-Zeile
 * getippt, sobald die Komponente sichtbar wird (wir starten den Timer
 * nicht beim Mount, sondern bei IntersectionObserver, damit Inhalte
 * erst dann animieren, wenn sie tatsächlich in den Viewport scrollen).
 *
 * Coloring-Heuristik (sehr simpel, aber wirkungsvoll auf typischen
 * Code-/Shell-Snippets):
 *   - Zeilen mit `$ …`  → Prompt grün, Rest hell
 *   - Zeilen mit `# …`  → Kommentar grau-blau
 *   - Strings in "..."  → coral
 *   - Schlüsselwörter (SELECT, FROM, WHERE, …) → mintgrün
 *   - Sonst: navy-100
 */
export function TerminalBlock({
  title,
  markdown,
  variant = "neutral",
  label,
}: Props): React.ReactElement {
  const [visible, setVisible] = useState(0);
  const [started, setStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Trigger typing on viewport entry (works on initial mount AND on reveal).
  useEffect(() => {
    if (!containerRef.current) return;
    const node = containerRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !started) {
            setStarted(true);
            obs.disconnect();
          }
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [started]);

  // The actual typing loop.
  useEffect(() => {
    if (!started) return;
    setVisible(0);
    let i = 0;
    let cancelled = false;
    const total = markdown.length;
    const step = Math.max(2, Math.floor(total / 200));
    function tick(): void {
      if (cancelled) return;
      i = Math.min(i + step, total);
      setVisible(i);
      if (i < total) {
        // Pause kurz an Zeilenenden für eine natürlichere Tipp-Kadenz.
        const ch = markdown[i - 1];
        const delay = ch === "\n" ? 70 : 18;
        window.setTimeout(tick, delay);
      }
    }
    tick();
    return () => {
      cancelled = true;
    };
  }, [started, markdown]);

  const v = VARIANT_STYLE[variant];
  const headerLabel = label ?? title;
  const shown = markdown.slice(0, visible);
  const lines = shown.split("\n");
  const isFinished = visible >= markdown.length;

  return (
    <div
      ref={containerRef}
      className={`my-0 overflow-hidden rounded-card border ${v.ringColor} bg-navy-1000 text-navy-100 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7)]`}
    >
      {/* Top label strip with status icon */}
      <div className="flex items-center justify-between border-b border-white/5 bg-navy-900/70 px-4 py-2">
        <span
          className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] ${v.headerColor}`}
        >
          <span aria-hidden="true">{v.icon}</span>
          {headerLabel}
        </span>
      </div>
      {/* macOS Ampel-Dots */}
      <div className="flex items-center gap-1.5 border-b border-white/5 bg-navy-900/30 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
      </div>
      {/* Code body */}
      <pre className="overflow-x-auto px-5 py-5 font-mono text-sm leading-[1.7] whitespace-pre-wrap">
        <code className="block">
          {lines.map((line, idx) => (
            <Line
              key={idx}
              text={line}
              isLast={idx === lines.length - 1}
              showCursor={idx === lines.length - 1 && !isFinished}
            />
          ))}
          {isFinished && (
            <span className="terminal-cursor" aria-hidden="true">
              &nbsp;
            </span>
          )}
        </code>
      </pre>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Line-Renderer mit minimalem syntactic highlighting                */
/* ---------------------------------------------------------------- */

const SQL_KEYWORDS =
  /\b(SELECT|FROM|WHERE|INSERT|INTO|UPDATE|SET|DELETE|JOIN|ON|AND|OR|NOT|NULL|VALUES|TABLE|CREATE|DROP|ALTER|AS|LIMIT|ORDER|BY|GROUP|HAVING)\b/gi;

function Line({
  text,
  isLast,
  showCursor,
}: {
  text: string;
  isLast: boolean;
  showCursor: boolean;
}): React.ReactElement {
  if (text.startsWith("$ ") || text === "$") {
    const rest = text.slice(2);
    return (
      <span className="block">
        <span className="text-teal-400">$</span>{" "}
        <PromptBody text={rest} />
        {showCursor && (
          <span className="terminal-cursor" aria-hidden="true">
            &nbsp;
          </span>
        )}
        {!isLast && "\n"}
      </span>
    );
  }
  if (/^\s*#/.test(text)) {
    return (
      <span className="block text-navy-400">
        {text}
        {showCursor && (
          <span className="terminal-cursor" aria-hidden="true">
            &nbsp;
          </span>
        )}
        {!isLast && "\n"}
      </span>
    );
  }
  return (
    <span className="block">
      <Highlighted text={text} />
      {showCursor && (
        <span className="terminal-cursor" aria-hidden="true">
          &nbsp;
        </span>
      )}
      {!isLast && "\n"}
    </span>
  );
}

function PromptBody({ text }: { text: string }): React.ReactElement {
  // First word = command name in white, rest in muted gray
  const m = /^(\S+)(\s.*)?$/.exec(text);
  if (!m) return <span className="text-navy-100">{text}</span>;
  return (
    <>
      <span className="text-white">{m[1]}</span>
      {m[2] && <span className="text-navy-400">{m[2]}</span>}
    </>
  );
}

function Highlighted({ text }: { text: string }): React.ReactElement {
  // Step 1: split on string literals first (don't recolor inside strings)
  const parts: Array<{ kind: "code" | "string"; value: string }> = [];
  let last = 0;
  const stringRe = /"([^"\\]|\\.)*"/g;
  let m: RegExpExecArray | null;
  while ((m = stringRe.exec(text)) !== null) {
    if (m.index > last) {
      parts.push({ kind: "code", value: text.slice(last, m.index) });
    }
    parts.push({ kind: "string", value: m[0] });
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    parts.push({ kind: "code", value: text.slice(last) });
  }
  return (
    <>
      {parts.map((p, i) =>
        p.kind === "string" ? (
          <span key={i} className="text-salmon-300">
            {p.value}
          </span>
        ) : (
          <CodeRun key={i} text={p.value} />
        ),
      )}
    </>
  );
}

function CodeRun({ text }: { text: string }): React.ReactElement {
  // Highlight SQL/JS-ish keywords inside the code segments.
  const out: React.ReactNode[] = [];
  let i = 0;
  let m: RegExpExecArray | null;
  SQL_KEYWORDS.lastIndex = 0;
  while ((m = SQL_KEYWORDS.exec(text)) !== null) {
    if (m.index > i) {
      out.push(<span key={`p${i}`}>{text.slice(i, m.index)}</span>);
    }
    out.push(
      <span key={`k${m.index}`} className="text-teal-300">
        {m[0]}
      </span>,
    );
    i = m.index + m[0].length;
  }
  if (i < text.length) out.push(<span key={`t${i}`}>{text.slice(i)}</span>);
  return <span className="text-navy-100">{out}</span>;
}
