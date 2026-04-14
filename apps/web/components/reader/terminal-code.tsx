"use client";

import { useEffect, useRef, useState } from "react";

/**
 * macOS-Style Terminal-Block für Code-Snippets.
 *
 * Features:
 *   - Drei Ampel-Dots; im :hover wird ✕ − + sichtbar.
 *   - Tipp-Animation: Code wird zeichenweise eingeblendet (in einem Schritt
 *     pro frame, nicht via CSS character-delay → besser bei langen Snippets).
 *   - Permanenter blinkender Cursor am Ende.
 */
export function TerminalCode({
  language,
  code,
}: {
  language: string;
  code: string;
}): React.ReactElement {
  const [visible, setVisible] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setVisible(0);
    let i = 0;
    function tick(): void {
      i += Math.max(1, Math.floor(code.length / 200));
      if (i >= code.length) {
        setVisible(code.length);
        return;
      }
      setVisible(i);
      timer.current = window.setTimeout(tick, 16);
    }
    tick();
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, [code]);

  return (
    <div className="group my-4 overflow-hidden rounded-card border border-navy-700 bg-navy-900 text-navy-50 shadow-lg">
      <div className="flex items-center gap-2 border-b border-navy-700/60 bg-navy-800 px-3 py-2">
        <Dot color="bg-red-400" hoverGlyph="✕" />
        <Dot color="bg-yellow-400" hoverGlyph="−" />
        <Dot color="bg-green-400" hoverGlyph="+" />
        <span className="ml-3 select-none text-[11px] uppercase tracking-wider text-navy-400">
          {language}
        </span>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed">
        <code>
          {code.slice(0, visible)}
          <span className="terminal-cursor" aria-hidden="true">
            &nbsp;
          </span>
        </code>
      </pre>
    </div>
  );
}

function Dot({
  color,
  hoverGlyph,
}: {
  color: string;
  hoverGlyph: string;
}): React.ReactElement {
  return (
    <span
      className={`flex h-3 w-3 items-center justify-center rounded-full text-[8px] font-bold text-navy-900 ${color}`}
    >
      <span className="opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        {hoverGlyph}
      </span>
    </span>
  );
}
