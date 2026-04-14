import Link from "next/link";

export function HowItWorks(): React.ReactElement {
  const steps = [
    {
      n: 1,
      title: "Handout schreiben",
      body:
        "Erstellen Sie Abschnitte im Editor und legen Sie pro Block fest, ab welcher Folie er sichtbar wird. Markdown wird unterstützt.",
    },
    {
      n: 2,
      title: "Link teilen",
      body:
        "Starten Sie eine Session und teilen Sie den Link oder QR-Code — vor dem Vortrag oder live auf der Leinwand.",
    },
    {
      n: 3,
      title: "Vortragen & steuern",
      body:
        "Schalten Sie Folien weiter — manuell im Dashboard oder automatisch per PowerPoint-Add-in. Die Inhalte erscheinen beim Publikum.",
    },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-24 text-center">
      <span className="inline-flex rounded-pill bg-teal-400/15 px-3 py-1 text-xs font-medium text-teal-300">
        In drei Schritten
      </span>
      <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        So einfach funktioniert Slide Handout
      </h2>
      <div className="mt-14 grid gap-10 sm:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n}>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-400 text-lg font-semibold text-navy-1000 shadow-sm shadow-teal-400/40">
              {s.n}
            </div>
            <h3 className="mt-5 text-lg font-semibold text-white">
              {s.title}
            </h3>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-navy-100">
              {s.body}
            </p>
          </div>
        ))}
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
        "Ändern Sie einen Tippfehler im Editor — das Publikum sieht sofort die korrigierte Version. Keine neuen PDFs verschicken.",
    },
    {
      title: "Kein Login für Zuhörer",
      body:
        "QR-Code scannen oder Link öffnen — das reicht. Funktioniert auf jedem Gerät mit Browser.",
    },
    {
      title: "PowerPoint-Integration",
      body:
        "Das Add-in meldet Folienwechsel automatisch an Slide Handout. Sie müssen nichts manuell umschalten.",
    },
    {
      title: "Manuelle Blöcke",
      body:
        "Manche Inhalte sollen erst auf Knopfdruck erscheinen? Kein Problem — manuell freigegebene Blöcke sind eingebaut.",
    },
    {
      title: "Druckbar",
      body:
        "Nach dem Vortrag können Zuhörer das komplette Handout als PDF speichern oder direkt ausdrucken.",
    },
  ];
  return (
    <section className="border-t border-white/5 bg-navy-1000/60">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center">
          <span className="inline-flex rounded-pill bg-teal-400/15 px-3 py-1 text-xs font-medium text-teal-300">
            Warum Slide Handout?
          </span>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Was es anders macht als ein PDF
          </h2>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {items.map((it) => (
            <div
              key={it.title}
              className="rounded-card border border-white/5 bg-navy-900 p-6"
            >
              <h3 className="text-base font-semibold text-white">{it.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-navy-100">
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
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="grid gap-12 md:grid-cols-2">
        <div>
          <span className="inline-flex rounded-pill bg-teal-400/15 px-3 py-1 text-xs font-medium text-teal-300">
            Für wen?
          </span>
          <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
            Gebaut für alle, die live präsentieren
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-navy-100">
            Egal ob Hörsaal, Meetingraum oder Konferenzbühne — überall dort,
            wo Zuhörer Begleitmaterial brauchen, aber nicht alles auf einmal
            sehen sollen.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((a) => (
            <div
              key={a.title}
              className="rounded-card border border-white/5 bg-navy-900 p-5"
            >
              <p className="text-sm font-semibold text-teal-300">
                {a.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-navy-100">
                {a.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { DemoButton } from "./demo-button";

export function FinalCta({
  loggedIn,
}: {
  loggedIn: boolean;
}): React.ReactElement {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="rounded-[20px] border border-white/10 bg-gradient-to-br from-teal-400/15 via-navy-900 to-navy-900 px-8 py-16 text-center">
        <h2 className="mx-auto max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {loggedIn
            ? "Dein Dashboard wartet."
            : "Bereit für bessere Handouts?"}
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-navy-100">
          {loggedIn
            ? "Starte eine neue Session oder bearbeite ein bestehendes Handout."
            : "Erstelle deinen kostenlosen Account oder klicke dich in einer Minute durch den Demo-Zugang."}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {loggedIn ? (
            <Link
              href="/dashboard"
              className="rounded-pill bg-teal-400 px-5 py-3 text-sm font-semibold text-navy-1000 shadow-sm shadow-teal-400/30 hover:bg-teal-300"
            >
              Zum Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="rounded-pill bg-teal-400 px-5 py-3 text-sm font-semibold text-navy-1000 shadow-sm shadow-teal-400/30 hover:bg-teal-300"
              >
                Kostenlos starten
              </Link>
              <DemoButton
                className="rounded-pill border border-white/15 px-5 py-3 text-sm font-medium text-white hover:border-white/40 hover:bg-white/5"
                label="Als Demo einloggen"
              />
            </>
          )}
        </div>
        {!loggedIn && (
          <p className="mx-auto mt-4 max-w-md text-xs text-navy-400">
            Der Demo-Zugang ist abgesichert read-only — du kannst alles
            ansehen und Sessions starten, aber keine echten Daten verändern.
          </p>
        )}
      </div>
    </section>
  );
}

export function Footer(): React.ReactElement {
  return (
    <footer className="border-t border-white/5">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-navy-400">
        <span className="font-medium text-navy-100">Slide Handout</span>
        <div className="flex items-center gap-5">
          <Link href="/dashboard" className="hover:text-white">
            Dashboard
          </Link>
          <Link href="/powerpoint-addin" className="hover:text-white">
            PowerPoint
          </Link>
          <Link href="/login" className="hover:text-white">
            Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
