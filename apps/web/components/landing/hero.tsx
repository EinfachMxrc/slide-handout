import Link from "next/link";
import { BrowserMockup } from "./mockup";
import { DemoButton } from "./demo-button";

export function Hero({
  loggedIn,
}: {
  loggedIn: boolean;
}): React.ReactElement {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 30% 0%, rgba(95,191,191,0.16), transparent 55%), radial-gradient(circle at 75% 10%, rgba(240,127,111,0.12), transparent 55%)",
        }}
      />
      <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-teal-400 via-teal-300 to-salmon-400" />
      <div className="mx-auto max-w-5xl px-6 pt-16 text-center sm:pt-24">
        <span className="inline-flex rounded-pill bg-teal-400/15 px-3 py-1 text-xs font-medium text-teal-300">
          Für Vorträge, Workshops &amp; Seminare
        </span>
        <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-6xl md:text-7xl">
          Das Handout, das
          <br />
          erst aufdeckt,
          <br />
          <span className="bg-gradient-to-r from-teal-300 to-salmon-300 bg-clip-text text-transparent">
            wenn Sie es sagen.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-navy-100 sm:text-lg">
          Ihre Zuhörer sehen im Handout nur den Abschnitt, den Sie gerade
          besprechen. Kein Vorblättern, kein Spoilern — und für Ihr Publikum
          reicht ein Link im Browser.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {loggedIn ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-pill bg-teal-400 px-6 py-3 text-sm font-semibold text-navy-1000 shadow-sm shadow-teal-400/30 hover:bg-teal-300"
              >
                Zum Dashboard
              </Link>
              <Link
                href="/handouts/new"
                className="rounded-pill border border-white/15 px-6 py-3 text-sm font-medium text-white hover:border-white/40 hover:bg-white/5"
              >
                Neues Handout anlegen
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/register"
                className="rounded-pill bg-teal-400 px-6 py-3 text-sm font-semibold text-navy-1000 shadow-sm shadow-teal-400/30 hover:bg-teal-300"
              >
                Kostenlos starten
              </Link>
              <DemoButton
                className="rounded-pill border border-white/15 px-6 py-3 text-sm font-medium text-white hover:border-white/40 hover:bg-white/5"
                label="Demo ansehen"
              />
            </>
          )}
        </div>
        <p className="mt-4 text-xs text-navy-400">
          {loggedIn
            ? "Du bist angemeldet — direkt ins Dashboard."
            : "Keine Kreditkarte · Demo-Account sofort verfügbar"}
        </p>
      </div>

      <div id="demo" className="mx-auto mt-14 max-w-6xl px-6 sm:mt-20">
        <BrowserMockup />
      </div>
    </section>
  );
}
