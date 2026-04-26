import { RotatingTabs, type RotatingTab } from "./rotating-tabs";
import { Reveal } from "./reveal";
import { AnimatedText } from "./animated-text";

/**
 * FeatureTabs — Air-style auto-rotating Showcase der drei Produktsäulen:
 * Editor · Live-Steuerung · PowerPoint-Add-in.
 *
 * Die drei Visuals sind reine CSS/SVG-Mockups (kein externes Asset, kein
 * Bundle-Hit) und teilen sich Tokens mit `BrowserMockup`. Sobald wir echte
 * Screenshots/PNGs haben, lassen sie sich 1:1 gegen `<Image>` tauschen.
 */
export function FeatureTabs(): React.ReactElement {
  const tabs: RotatingTab[] = [
    {
      id: "editor",
      label: "Editor",
      title: "Schreiben wie in einem Dokument.",
      body:
        "Markdown, Drag-&-Drop-Reihenfolge und ein eingebauter Slide-Trigger pro Block. Keine separate CMS-Maske, kein Workflow — nur ein Dokument, das weiß, wann jeder Absatz erscheint.",
      visual: <EditorVisual />,
    },
    {
      id: "live",
      label: "Live-Steuerung",
      title: "Folien weiter — Publikum sieht mit.",
      body:
        "Aktuelle Folie im Dashboard hochzählen, freigegebene Blöcke erscheinen synchron beim Publikum. Mit einem Klick einzelne Inhalte spontan freigeben oder zurückhalten.",
      visual: <LiveVisual />,
    },
    {
      id: "addin",
      label: "PowerPoint-Add-in",
      title: "Vergessen, dass es da ist.",
      body:
        "Das Add-in pollt PowerPoint im Hintergrund und meldet jeden Folienwechsel automatisch. Sie präsentieren wie immer — Slide Handout reagiert, ohne dass Sie umschalten.",
      visual: <AddinVisual />,
    },
  ];

  return (
    <section id="features-tabs" className="bg-paper text-ink">
      <div className="mx-auto max-w-7xl px-6 py-28 sm:py-36">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute">
              <span aria-hidden className="inline-block h-px w-6 bg-ink-mute/40" />
              Drei Säulen
            </span>
          </Reveal>
          <AnimatedText
            as="h2"
            className="mt-6 font-display text-5xl leading-[0.95] tracking-tight sm:text-6xl"
            lines={[
              "Ein Werkzeug,",
              <em
                key="buehnen"
                className="font-display italic text-ink-mute"
              >
                drei Bühnen.
              </em>,
            ]}
            ariaLabel="Ein Werkzeug, drei Bühnen."
          />
        </div>

        <Reveal delay={1}>
          <RotatingTabs tabs={tabs} intervalSec={12} />
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Visuals — leichte CSS-Mockups, später durch PNGs ersetzbar ---------- */

function VisualFrame({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-card border border-paper-line bg-paper-soft shadow-[0_30px_60px_-30px_rgba(0,0,0,0.25)]">
      {children}
    </div>
  );
}

function EditorVisual(): React.ReactElement {
  const blocks = [
    { title: "Einleitung", trigger: "Folie 1", active: true },
    { title: "Grundlagen", trigger: "Folie 3", active: true },
    { title: "Fallbeispiel", trigger: "Folie 5", active: false },
    { title: "Ergebnisse", trigger: "Folie 8", active: false },
  ];
  return (
    <VisualFrame>
      <div className="flex h-full">
        <div className="flex w-1/3 flex-col gap-2 border-r border-paper-line bg-paper p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
            Abschnitte
          </p>
          {blocks.map((b) => (
            <div
              key={b.title}
              className={`rounded-lg border border-paper-line px-3 py-2 ${
                b.active ? "bg-paper-soft" : "bg-paper"
              }`}
            >
              <p className="text-xs font-semibold text-ink">{b.title}</p>
              <p className="mt-0.5 text-[10px] text-ink-mute">
                ab {b.trigger}
              </p>
            </div>
          ))}
        </div>
        <div className="flex-1 p-7">
          <p className="font-display text-2xl leading-tight tracking-tight">
            Grundlagen
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-ink-mute">
            erscheint ab Folie 3
          </p>
          <div className="mt-5 space-y-2">
            <div className="h-2 w-full rounded bg-paper-line" />
            <div className="h-2 w-[92%] rounded bg-paper-line" />
            <div className="h-2 w-[78%] rounded bg-paper-line" />
            <div className="h-2 w-[88%] rounded bg-paper-line" />
            <div className="h-2 w-[60%] rounded bg-paper-line" />
          </div>
          <div className="mt-5 inline-flex items-center gap-2 rounded-pill border border-paper-line bg-paper px-3 py-1.5 text-[10px] text-ink-mute">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Auto-Save
          </div>
        </div>
      </div>
    </VisualFrame>
  );
}

function LiveVisual(): React.ReactElement {
  return (
    <VisualFrame>
      <div className="grid h-full grid-cols-[1fr_1.4fr]">
        <div className="flex flex-col items-center justify-center gap-3 border-r border-paper-line bg-paper p-6">
          <p className="text-[10px] uppercase tracking-[0.14em] text-ink-mute">
            Aktuelle Folie
          </p>
          <p className="font-display text-7xl leading-none tracking-tight">5</p>
          <div className="mt-2 flex gap-2">
            <button className="rounded-pill border border-paper-line bg-paper px-3 py-1 text-xs text-ink-mute">
              ←
            </button>
            <button className="rounded-pill bg-ink px-4 py-1 text-xs text-paper">
              Weiter →
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2 p-5">
          <p className="text-[10px] uppercase tracking-[0.14em] text-ink-mute">
            Publikumsansicht
          </p>
          {[
            { t: "Einleitung", revealed: true },
            { t: "Grundlagen", revealed: true },
            { t: "Fallbeispiel", revealed: true },
          ].map((b) => (
            <div
              key={b.t}
              className="rounded-lg border border-paper-line bg-paper p-3"
            >
              <p className="text-xs font-semibold text-ink">{b.t}</p>
              <div className="mt-1.5 space-y-1">
                <div className="h-1.5 w-full rounded bg-paper-line" />
                <div className="h-1.5 w-[80%] rounded bg-paper-line" />
              </div>
            </div>
          ))}
          <div className="rounded-lg border border-dashed border-paper-line p-3 text-center text-[10px] text-ink-mute">
            Erscheint ab Folie 8 …
          </div>
        </div>
      </div>
    </VisualFrame>
  );
}

function AddinVisual(): React.ReactElement {
  return (
    <VisualFrame>
      <div className="relative h-full">
        {/* PowerPoint-ähnliche Slide-Fläche */}
        <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_rgba(120,180,240,0.18),_transparent_60%)]">
          <div className="aspect-[16/9] w-[78%] rounded-md border border-paper-line bg-paper p-8 shadow-[0_20px_50px_-25px_rgba(0,0,0,0.3)]">
            <p className="font-display text-3xl leading-tight tracking-tight">
              Fallbeispiel
            </p>
            <div className="mt-4 space-y-2">
              <div className="h-1.5 w-full rounded bg-paper-line" />
              <div className="h-1.5 w-[70%] rounded bg-paper-line" />
            </div>
            <p className="mt-6 text-[10px] uppercase tracking-[0.14em] text-ink-mute">
              Folie 5 / 12
            </p>
          </div>
        </div>
        {/* Add-in Pane (rechts) */}
        <div className="absolute inset-y-3 right-3 w-44 rounded-lg border border-paper-line bg-paper/95 p-3 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.25)] backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink">
              Verbunden
            </p>
          </div>
          <p className="mt-3 text-[10px] text-ink-mute">Aktuelle Folie</p>
          <p className="font-display text-2xl leading-none">5</p>
          <p className="mt-3 text-[10px] text-ink-mute">Session</p>
          <p className="font-mono text-[10px] text-ink">demo-2026</p>
          <div className="mt-3 rounded border border-paper-line p-2 text-[9px] leading-tight text-ink-mute">
            3 Blöcke freigegeben · 2 ausstehend
          </div>
        </div>
      </div>
    </VisualFrame>
  );
}
