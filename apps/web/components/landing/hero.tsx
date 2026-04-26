import Link from "next/link";
import { SkyBackground } from "./sky-background";
import { DemoButton } from "./demo-button";
import { HeroWordmark } from "./hero-wordmark";

/**
 * Air-inspirierter Hero — Full-Bleed Sky + riesiger Italic-Wordmark.
 *
 * Statt der bisherigen Marketing-Stack-Variante (Eyebrow + Headline + Subline +
 * Buttons + Mockup) trägt der Hero nur noch das Brand-Statement: ein einziges
 * fliegendes Wort als Centerpiece. Subline + CTAs sitzen darunter, klein und
 * weiß — der Himmel macht die Bühne.
 *
 * Die Mockup-Browser-Demo zieht in die Sections darunter um (HowItWorks etc.).
 */
export function Hero({
  loggedIn,
}: {
  loggedIn: boolean;
}): React.ReactElement {
  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden">
      <SkyBackground />

      <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col px-6">
        {/* Sticky-feel: das Wort bleibt vertikal mittig, CTAs hängen unten. */}
        <div className="flex flex-1 items-center justify-center pt-24">
          <HeroWordmark>
            Handout
            <span aria-hidden className="inline-block w-[0.05em]" />
          </HeroWordmark>
        </div>

        <div className="pb-16 sm:pb-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mx-auto max-w-xl text-base font-medium leading-relaxed text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.25)] sm:text-lg">
              Das Handout, das erst aufdeckt,{" "}
              <em className="font-display italic">wenn Sie es sagen.</em>
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              {loggedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className="rounded-pill bg-white px-6 py-3 text-sm font-semibold text-ink shadow-[0_4px_24px_rgba(0,0,0,0.12)] transition hover:bg-white/90"
                  >
                    Zum Dashboard
                  </Link>
                  <Link
                    href="/handouts/new"
                    className="rounded-pill border border-white/60 bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20"
                  >
                    Neues Handout
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="rounded-pill bg-white px-6 py-3 text-sm font-semibold text-ink shadow-[0_4px_24px_rgba(0,0,0,0.12)] transition hover:bg-white/90"
                  >
                    Kostenlos starten
                  </Link>
                  <DemoButton
                    className="rounded-pill border border-white/60 bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20"
                    label="Demo ansehen"
                  />
                </>
              )}
            </div>
            <p className="mt-4 text-xs text-white/70">
              {loggedIn
                ? "Du bist angemeldet."
                : "Keine Kreditkarte · Demo sofort verfügbar"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
