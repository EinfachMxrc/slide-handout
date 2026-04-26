import { MouseTiltCard } from "./mouse-tilt-card";

/**
 * BrowserMockup — App-Screenshot-Mockup für den Landing-Hero.
 *
 * Simuliert die Cue-App im Live-Einsatz: Browser-Chrome → App-Top-Bar
 * (Brand, Live-Puls, Timer, Avatar) → zweispaltiger Body (Presenter-
 * Steuerung links, Publikum-Ansicht rechts) → Status-Bar unten.
 *
 * Der Wrapper ist eine `MouseTiltCard`, die den gesamten Block in eine
 * 3D-Tilt-Card mit Sheen-Overlay packt. `borderRadius: inherit` auf dem
 * Sheen greift auf die 20px-Radius dieses Containers zu.
 */
export function BrowserMockup(): React.ReactElement {
  const slides = [
    {
      n: 1,
      reveal: "Einleitung",
      sub: "Willkommen",
      revealed: true,
    },
    {
      n: 3,
      reveal: "Grundlagen",
      sub: "Markt & Kontext",
      revealed: true,
    },
    {
      n: 5,
      reveal: "Fallbeispiel",
      sub: "Q2 · Pilot",
      revealed: true,
      current: true,
    },
    {
      n: 8,
      reveal: "Ergebnisse",
      sub: "Zahlen, KPIs",
      revealed: false,
    },
    {
      n: 12,
      reveal: "Fazit",
      sub: "Take-aways",
      revealed: false,
    },
  ];

  const revealed = [
    {
      eyebrow: "Einleitung",
      title: "Überblick Q2",
      body:
        "Die wichtigsten Entwicklungen im zweiten Quartal: Wachstum, neue Kunden, Produkt-Launches.",
    },
    {
      eyebrow: "Grundlagen",
      title: "Marktumfeld",
      body:
        "Wie der Markt sich seit Jahresbeginn verändert hat und welche Chancen daraus entstehen.",
      meta: ["+18 % YoY", "7 Regionen", "142 Kunden"],
    },
    {
      eyebrow: "Fallbeispiel · gerade freigegeben",
      title: "Pilot mit Partnerunternehmen",
      body:
        "Drei Wochen gemeinsamer Pilot. Messbare Wirkung in allen relevanten KPIs — hier die Zahlen.",
      fresh: true,
    },
  ];

  return (
    <MouseTiltCard
      className="mx-auto max-w-5xl"
      cardClassName="overflow-hidden rounded-[20px] border border-white/10 bg-navy-900 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]"
    >
      {/* Browser-Chrome mit TLS-Indikator und URL */}
      <div className="flex items-center gap-3 border-b border-white/5 bg-navy-950 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
          <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
          <span className="h-3 w-3 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex-1 text-center">
          <span className="inline-flex items-center gap-2 rounded bg-navy-900 px-3 py-1 font-mono text-[11px] text-navy-400">
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-3 w-3 fill-current"
            >
              <path d="M12 1a5 5 0 0 0-5 5v3H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V11a2 2 0 0 0-2-2h-2V6a5 5 0 0 0-5-5Zm3 8H9V6a3 3 0 0 1 6 0v3Z" />
            </svg>
            cue.app/h/q2-update
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.14em] text-navy-400">
          TLS
        </span>
      </div>

      {/* App-Top-Bar: Brand, Session, Live-Puls, Timer, Avatar */}
      <div className="flex items-center justify-between border-b border-white/5 bg-navy-950/60 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="font-display text-lg italic text-white">Cue</span>
          <span className="h-4 w-px bg-white/10" />
          <span className="text-[10px] uppercase tracking-[0.14em] text-navy-400">
            Session · Q2-Update
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 rounded-pill border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-400">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span
                aria-hidden
                className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-70"
              />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Live
          </span>
          <span className="font-mono text-xs text-navy-100">12:34</span>
          <div
            aria-hidden
            className="h-7 w-7 rounded-full bg-gradient-to-br from-teal-300 to-teal-600 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
          />
        </div>
      </div>

      {/* Body: Presenter-Steuerung links · Publikum rechts */}
      <div className="grid gap-0 sm:grid-cols-[0.85fr_1.15fr]">
        {/* ── Presenter column ── */}
        <div className="space-y-5 border-b border-white/5 p-6 sm:border-b-0 sm:border-r sm:p-7">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-400">
              Presenter · Steuerung
            </p>
            <div className="mt-4 flex items-baseline gap-3">
              <p className="font-display text-6xl leading-none tracking-tight text-teal-400">
                5
              </p>
              <p className="text-xs text-navy-400">
                von <span className="text-navy-100">12 Folien</span>
              </p>
            </div>
            {/* Progress-Leiste */}
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-navy-850">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-200"
                style={{ width: "42%" }}
              />
            </div>
            {/* Prev/Next */}
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-pill border border-white/10 bg-navy-850 px-3 py-1.5 text-xs text-navy-100"
              >
                <span aria-hidden>←</span>
                Zurück
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-pill bg-teal-400 px-4 py-1.5 text-xs font-semibold text-navy-950"
              >
                Weiter
                <span aria-hidden>→</span>
              </button>
            </div>
          </div>

          {/* Folien-Liste mit Mini-Thumbnails */}
          <ul className="space-y-1.5">
            {slides.map((s) => (
              <li
                key={s.n}
                className={`flex items-center gap-3 rounded-lg border px-2.5 py-2 ${
                  s.current
                    ? "border-teal-400/40 bg-teal-400/[0.08]"
                    : "border-white/5 bg-navy-850"
                }`}
              >
                {/* 16:10-Thumbnail — angedeutet, keine echten Screenshots */}
                <div
                  aria-hidden
                  className={`aspect-[16/10] w-12 shrink-0 overflow-hidden rounded-sm border ${
                    s.current
                      ? "border-teal-400/30 bg-navy-950"
                      : "border-white/10 bg-navy-950"
                  }`}
                >
                  <div className="h-full w-full bg-gradient-to-br from-white/[0.06] to-transparent" />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-xs font-semibold ${
                      s.current
                        ? "text-white"
                        : s.revealed
                          ? "text-navy-100"
                          : "text-navy-400"
                    }`}
                  >
                    {s.reveal}
                  </p>
                  <p className="truncate text-[10px] text-navy-400">
                    Folie {s.n} · {s.sub}
                  </p>
                </div>
                <span
                  aria-hidden
                  className={`h-2 w-2 shrink-0 rounded-full ${s.revealed ? "bg-emerald-400" : "bg-navy-700"}`}
                />
              </li>
            ))}
          </ul>
        </div>

        {/* ── Audience column ── */}
        <div className="space-y-4 p-6 sm:p-7">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-400">
              Ansicht · Publikum
            </p>
            <span className="inline-flex items-center gap-1.5 text-[10px] text-navy-400">
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"
              />
              24 online
            </span>
          </div>

          {/* Handout-Titel-Card */}
          <div className="rounded-lg border border-white/5 bg-navy-850 p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-navy-400">
              Quartals-Update
            </p>
            <p className="mt-1 font-display text-xl italic text-white">
              Q2 2026
            </p>
            <div className="mt-3 h-px w-10 bg-white/10" />
            <p className="mt-3 text-[11px] text-navy-100">
              Max Streamt · Finance &amp; Ops
            </p>
          </div>

          {/* Revealed-Blocks */}
          <ul className="space-y-2.5">
            {revealed.map((b) => (
              <li
                key={b.title}
                className={`rounded-lg border p-4 ${
                  b.fresh
                    ? "border-teal-400/30 bg-teal-400/[0.06] shadow-[0_0_0_1px_rgba(94,234,212,0.10)]"
                    : "border-white/5 bg-navy-850"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p
                    className={`text-[10px] uppercase tracking-[0.14em] ${
                      b.fresh ? "text-teal-300" : "text-navy-400"
                    }`}
                  >
                    {b.eyebrow}
                  </p>
                  {b.fresh ? (
                    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] text-teal-300">
                      <span
                        aria-hidden
                        className="inline-block h-1 w-1 rounded-full bg-teal-300"
                      />
                      neu
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm font-semibold text-white">
                  {b.title}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-navy-100">
                  {b.body}
                </p>
                {b.meta ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {b.meta.map((m) => (
                      <span
                        key={m}
                        className="rounded border border-white/10 bg-navy-900 px-2 py-0.5 font-mono text-[10px] text-navy-100"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
            {/* Placeholder für den nächsten Block */}
            <li className="flex items-center gap-3 rounded-lg border border-dashed border-white/10 p-4 text-[11px] text-navy-400">
              <span
                aria-hidden
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 font-mono text-[10px]"
              >
                8
              </span>
              <span>
                <span className="font-semibold text-navy-100">
                  „Ergebnisse"
                </span>{" "}
                erscheint, sobald Folie 8 läuft …
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Status-Bar unten */}
      <div className="flex items-center justify-between gap-4 border-t border-white/5 bg-navy-950 px-5 py-2.5 text-[10px] text-navy-400">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"
            />
            Verbunden · WebSocket
          </span>
          <span className="hidden font-mono sm:inline">Sync &lt; 80 ms</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden font-mono sm:inline">
            3 / 5 Blöcke freigegeben
          </span>
          <span className="font-mono">cue.app</span>
        </div>
      </div>
    </MouseTiltCard>
  );
}
