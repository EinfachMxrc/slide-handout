import Link from "next/link";
import { BrowserMockup } from "./mockup";
import { DemoButton } from "./demo-button";

/**
 * Paper-Sections — sitzen unter dem Sky-Hero. Editorial-Stack mit
 * großzügigem Whitespace, Italic-Highlight in den Headlines und einer
 * dezenten Hairline-Bento-Card-Grid.
 *
 * Air macht Sectionwechsel über volle Background-Wechsel; wir folgen dem
 * Muster: Paper (default) → Soft (alternativ) → Ink (Final-CTA, dunkel).
 */

function Eyebrow({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute">
      <span aria-hidden className="inline-block h-px w-6 bg-ink-mute/40" />
      {children}
    </span>
  );
}

export function HowItWorks(): React.ReactElement {
  const steps = [
    {
      n: "01",
      title: "Handout schreiben",
      body:
        "Abschnitte im Editor anlegen und pro Block festlegen, ab welcher Folie er sichtbar wird. Markdown wird unterstützt.",
    },
    {
      n: "02",
      title: "Link teilen",
      body:
        "Session starten und Link oder QR-Code teilen — vor dem Vortrag oder live auf der Leinwand.",
    },
    {
      n: "03",
      title: "Vortragen & steuern",
      body:
        "Folien weiterschalten — manuell im Dashboard oder automatisch per PowerPoint-Add-in. Inhalte erscheinen beim Publikum.",
    },
  ];
  return (
    <section id="how" className="bg-paper text-ink">
      <div className="mx-auto max-w-7xl px-6 py-28 sm:py-36">
        <div className="grid gap-16 md:grid-cols-12 md:items-end">
          <div className="md:col-span-5">
            <Eyebrow>So funktioniert&apos;s</Eyebrow>
            <h2 className="mt-6 font-display text-5xl leading-[0.95] tracking-tight sm:text-6xl">
              In drei Schritten{" "}
              <em className="font-display italic text-ink-mute">live.</em>
            </h2>
          </div>
          <p className="text-base leading-relaxed text-ink-mute md:col-span-6 md:col-start-7">
            Vom leeren Editor bis zum Publikum, das mitliest, sind es drei
            Schritte. Kein Setup, kein PDF-Versand, keine Spoiler.
          </p>
        </div>

        <div className="mt-20 grid gap-px overflow-hidden rounded-card bg-paper-line sm:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="group relative bg-paper p-8 transition hover:bg-paper-soft sm:p-10"
            >
              <span className="font-display text-4xl italic text-ink-mute/60">
                {s.n}
              </span>
              <h3 className="mt-6 text-xl font-semibold tracking-tight">
                {s.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-mute">
                {s.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <BrowserMockup />
        </div>
      </div>
    </section>
  );
}

export function Features(): React.ReactElement {
  const items = [
    {
      title: "Kontrollierte Freigabe",
      body:
        "Ihr Publikum liest nur, was Sie gerade besprechen. Keine Spoiler, kein Vorblättern durch 40 Seiten.",
    },
    {
      title: "Immer aktuell",
      body:
        "Tippfehler im Editor korrigieren — das Publikum sieht sofort die neue Version. Keine neuen PDFs verschicken.",
    },
    {
      title: "Kein Login für Zuhörer",
      body:
        "QR-Code scannen oder Link öffnen — das reicht. Funktioniert auf jedem Gerät mit Browser.",
    },
    {
      title: "PowerPoint-Integration",
      body:
        "Das Add-in meldet Folienwechsel automatisch an Slide Handout. Nichts manuell umschalten.",
    },
    {
      title: "Manuelle Blöcke",
      body:
        "Inhalte, die erst auf Knopfdruck erscheinen sollen? Manuell freigegebene Blöcke sind eingebaut.",
    },
    {
      title: "Druckbar",
      body:
        "Nach dem Vortrag können Zuhörer das komplette Handout als PDF speichern oder ausdrucken.",
    },
  ];
  return (
    <section id="features" className="bg-paper-soft text-ink">
      <div className="mx-auto max-w-7xl px-6 py-28 sm:py-36">
        <div className="max-w-2xl">
          <Eyebrow>Was es kann</Eyebrow>
          <h2 className="mt-6 font-display text-5xl leading-[0.95] tracking-tight sm:text-6xl">
            Anders als ein{" "}
            <em className="font-display italic text-ink-mute">PDF.</em>
          </h2>
        </div>
        <div className="mt-16 grid gap-px overflow-hidden rounded-card bg-paper-line md:grid-cols-3">
          {items.map((it) => (
            <div key={it.title} className="bg-paper p-7 sm:p-8">
              <h3 className="text-base font-semibold tracking-tight">
                {it.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-mute">
                {it.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Audiences(): React.ReactElement {
  const list = [
    {
      title: "Dozierende",
      body: "Vorlesungsskripte, die dem Lehrplan folgen statt ihn vorwegnehmen.",
    },
    {
      title: "Trainer & Coaches",
      body: "Workshop-Unterlagen, die schrittweise mit den Übungen aufgebaut werden.",
    },
    {
      title: "Speaker",
      body: "Konferenz-Handouts, die Zuhörer im Takt des Vortrags erhalten.",
    },
    {
      title: "Unternehmen",
      body: "Interne Präsentationen mit kontrollierten Unterlagen statt loser PDF-Sammlungen.",
    },
  ];
  return (
    <section className="bg-paper text-ink">
      <div className="mx-auto max-w-7xl px-6 py-28 sm:py-36">
        <div className="grid gap-16 md:grid-cols-12">
          <div className="md:col-span-5">
            <Eyebrow>Für wen</Eyebrow>
            <h2 className="mt-6 font-display text-5xl leading-[0.95] tracking-tight sm:text-6xl">
              Für alle, die{" "}
              <em className="font-display italic text-ink-mute">live</em>{" "}
              präsentieren.
            </h2>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-ink-mute">
              Hörsaal, Meetingraum oder Bühne — überall, wo Zuhörer
              Begleitmaterial brauchen, aber nicht alles auf einmal sehen
              sollen.
            </p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-card bg-paper-line md:col-span-7 md:grid-cols-2">
            {list.map((a) => (
              <div key={a.title} className="bg-paper p-7">
                <p className="font-display text-xl italic">{a.title}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink-mute">
                  {a.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function FinalCta({
  loggedIn,
}: {
  loggedIn: boolean;
}): React.ReactElement {
  return (
    <section className="relative overflow-hidden bg-ink text-paper">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(120,180,240,0.55), transparent 70%)",
        }}
      />
      <div className="mx-auto max-w-3xl px-6 py-32 text-center sm:py-40">
        <h2 className="font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl">
          {loggedIn ? (
            <>
              Dein Dashboard{" "}
              <em className="font-display italic text-paper/70">wartet.</em>
            </>
          ) : (
            <>
              Bereit für{" "}
              <em className="font-display italic text-paper/70">
                bessere Handouts?
              </em>
            </>
          )}
        </h2>
        <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-paper/70">
          {loggedIn
            ? "Starte eine neue Session oder bearbeite ein bestehendes Handout."
            : "Erstelle deinen kostenlosen Account oder klicke dich in einer Minute durch den Demo-Zugang."}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {loggedIn ? (
            <Link
              href="/dashboard"
              className="rounded-pill bg-paper px-6 py-3 text-sm font-semibold text-ink shadow-[0_4px_24px_rgba(0,0,0,0.25)] transition hover:bg-white"
            >
              Zum Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="rounded-pill bg-paper px-6 py-3 text-sm font-semibold text-ink shadow-[0_4px_24px_rgba(0,0,0,0.25)] transition hover:bg-white"
              >
                Kostenlos starten
              </Link>
              <DemoButton
                className="rounded-pill border border-paper/40 bg-paper/5 px-6 py-3 text-sm font-medium text-paper backdrop-blur-md transition hover:bg-paper/15"
                label="Als Demo einloggen"
              />
            </>
          )}
        </div>
        {!loggedIn && (
          <p className="mx-auto mt-6 max-w-md text-xs text-paper/55">
            Der Demo-Zugang ist read-only — du kannst alles ansehen und
            Sessions starten, aber keine echten Daten verändern.
          </p>
        )}
      </div>
    </section>
  );
}

export function Footer(): React.ReactElement {
  return (
    <footer className="border-t border-paper-line bg-paper">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-10 text-sm text-ink-mute">
        <span className="font-display text-base italic text-ink">
          Slide Handout
        </span>
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="transition hover:text-ink">
            Dashboard
          </Link>
          <Link href="/powerpoint-addin" className="transition hover:text-ink">
            PowerPoint
          </Link>
          <Link href="/login" className="transition hover:text-ink">
            Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
