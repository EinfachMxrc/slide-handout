/**
 * macOS-Browser-Mockup für den Hero: zeigt links die Presenter-Steuerung
 * mit aktueller Folie und Block-Liste, rechts die Audience-Ansicht mit
 * schon freigegebenen Blöcken + dashed placeholder für künftige.
 */
export function BrowserMockup(): React.ReactElement {
  const slides = [
    { title: "Einleitung", slide: 1, revealed: true },
    { title: "Grundlagen", slide: 3, revealed: true },
    { title: "Fallbeispiel", slide: 5, revealed: true },
    { title: "Ergebnisse", slide: 8, revealed: false },
    { title: "Fazit", slide: 12, revealed: false },
  ];

  const revealed = [
    {
      title: "Einleitung",
      text: "Überblick über die Ziele und den Ablauf der heutigen Präsentation.",
    },
    {
      title: "Grundlagen",
      text: "Die wichtigsten Begriffe und Definitionen, die Sie für das Verständnis brauchen.",
    },
    {
      title: "Fallbeispiel",
      text: "Konkrete Zahlen und Ergebnisse aus der Pilotphase mit drei Partnerunternehmen.",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl overflow-hidden rounded-[20px] border border-white/10 bg-navy-900 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]">
      {/* Chrome */}
      <div className="flex items-center gap-3 border-b border-white/5 bg-navy-950 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
          <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
          <span className="h-3 w-3 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex-1 text-center">
          <span className="rounded bg-navy-900 px-3 py-1 font-mono text-xs text-navy-400">
            slide-handout.app/h/demo
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="grid gap-6 p-6 sm:grid-cols-[1fr_1.6fr] sm:gap-8 sm:p-8">
        {/* Presenter column */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
            Presenter-Steuerung
          </p>
          <div className="mt-5 flex flex-col items-center">
            <p className="text-6xl font-semibold tracking-tight text-teal-400">
              5
            </p>
            <p className="mt-1 text-xs text-navy-400">Aktuelle Folie</p>
          </div>
          <ul className="mt-6 space-y-2.5 text-sm">
            {slides.map((s) => (
              <li
                key={s.title}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-navy-850 px-3 py-2"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${s.revealed ? "bg-emerald-400" : "bg-navy-400"}`}
                  />
                  <span
                    className={
                      s.revealed ? "text-white" : "text-navy-400"
                    }
                  >
                    {s.title}
                  </span>
                </span>
                <span className="text-xs text-navy-400">Folie {s.slide}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Audience column */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
            Ansicht Ihres Publikums
          </p>
          <ul className="mt-5 space-y-3">
            {revealed.map((b) => (
              <li
                key={b.title}
                className="rounded-lg border border-white/5 bg-navy-850 p-4"
              >
                <p className="text-sm font-semibold text-white">{b.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-navy-100">
                  {b.text}
                </p>
              </li>
            ))}
            <li className="rounded-lg border border-dashed border-white/10 px-4 py-5 text-center text-xs text-navy-400">
              Weitere Abschnitte erscheinen, sobald die passende Folie
              erreicht wird …
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
